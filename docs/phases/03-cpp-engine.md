# Phase 3 — C++ Feature Engine via gRPC

## Goal

Replace the placeholder recommendation scores with real cosine-similarity vectors computed by the C++ Feature Engine. The gateway calls the engine via gRPC to obtain content similarity scores, which the ML service uses instead of random values.

---

## Prerequisites

- ✅ **Phase 1 complete** — gateway and ML service are operational
- ✅ **Phase 2 complete** — frontend can display recommendations
- GCC ≥ 12 **or** Clang ≥ 16
- CMake ≥ 3.25
- gRPC 1.62+ and protobuf 25+ (install via vcpkg or Conan)
- Eigen3 (matrix algebra)

### Install gRPC + protobuf (via vcpkg)

```bash
git clone https://github.com/microsoft/vcpkg
cd vcpkg && ./bootstrap-vcpkg.sh
./vcpkg install grpc protobuf eigen3
```

---

## Step-by-Step Setup

### 1. Define the gRPC Proto Contract

The canonical proto lives at `/infra/proto/feature_engine.proto` (see [API_CONTRACTS.md](../API_CONTRACTS.md) for the full definition).

Symlink or copy into the C++ project:

```bash
cp infra/proto/feature_engine.proto feature-engine-cpp/proto/
```

---

### 2. CMake Build System

`feature-engine-cpp/CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.25)
project(FeatureEngine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# --- Dependencies (via vcpkg toolchain) ---
find_package(gRPC CONFIG REQUIRED)
find_package(Protobuf CONFIG REQUIRED)
find_package(Eigen3 CONFIG REQUIRED)

# --- Protobuf code generation ---
set(PROTO_FILES proto/feature_engine.proto)
add_library(feature_engine_proto ${PROTO_FILES})
target_link_libraries(feature_engine_proto PUBLIC protobuf::libprotobuf gRPC::grpc++)
protobuf_generate(TARGET feature_engine_proto LANGUAGE cpp)
grpc_generate(TARGET feature_engine_proto LANGUAGE cpp)

# --- Main server binary ---
add_executable(feature_engine_server
  src/main.cpp
  src/FeatureEngineServiceImpl.cpp
  src/SimilarityComputer.cpp
)

target_link_libraries(feature_engine_server
  PRIVATE
    feature_engine_proto
    Eigen3::Eigen
    gRPC::grpc++_reflection
)

target_include_directories(feature_engine_server PRIVATE include)
```

---

### 3. gRPC Service Implementation

`feature-engine-cpp/src/FeatureEngineServiceImpl.cpp`:

```cpp
#include "FeatureEngineServiceImpl.hpp"
#include "SimilarityComputer.hpp"

grpc::Status FeatureEngineServiceImpl::ComputeSimilarity(
    grpc::ServerContext* context,
    const media::feature::SimilarityRequest* request,
    media::feature::SimilarityResponse* response)
{
    response->set_user_id(request->user_id());
    response->set_computed_at_ms(
        std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count()
    );

    auto scores = SimilarityComputer::computeCosine(
        request->user_id(),
        {request->content_ids().begin(), request->content_ids().end()},
        request->top_k()
    );

    for (auto& [contentId, score] : scores) {
        auto* s = response->add_scores();
        s->set_content_id(contentId);
        s->set_score(score);
    }

    return grpc::Status::OK;
}

grpc::Status FeatureEngineServiceImpl::BatchUpdate(
    grpc::ServerContext* context,
    const media::feature::BatchUpdateRequest* request,
    media::feature::BatchUpdateResponse* response)
{
    int processed = 0;
    for (const auto& event : request->events()) {
        SimilarityComputer::ingestEvent(
            event.user_id(), event.content_id(), event.weight()
        );
        ++processed;
    }
    response->set_processed_count(processed);
    response->set_failed_count(0);
    return grpc::Status::OK;
}
```

---

### 4. Similarity Computation (Eigen3)

`feature-engine-cpp/src/SimilarityComputer.cpp`:

```cpp
#include "SimilarityComputer.hpp"
#include <Eigen/Dense>
#include <unordered_map>
#include <mutex>

// In-memory interaction matrix: user_id -> sparse row vector (content_id -> weight)
static std::unordered_map<std::string,
    std::unordered_map<std::string, float>> g_matrix;
static std::mutex g_mutex;

void SimilarityComputer::ingestEvent(
    const std::string& userId,
    const std::string& contentId,
    float weight)
{
    std::lock_guard<std::mutex> lock(g_mutex);
    g_matrix[userId][contentId] += weight;
}

std::vector<std::pair<std::string, float>> SimilarityComputer::computeCosine(
    const std::string& userId,
    const std::vector<std::string>& contentIds,
    int topK)
{
    std::lock_guard<std::mutex> lock(g_mutex);

    auto userIt = g_matrix.find(userId);
    if (userIt == g_matrix.end()) {
        // No data yet — return uniform scores
        std::vector<std::pair<std::string, float>> result;
        for (auto& id : contentIds)
            result.emplace_back(id, 1.0f / contentIds.size());
        return result;
    }

    const auto& userRow = userIt->second;

    // Build content vectors from all users (simplified)
    std::vector<std::pair<std::string, float>> scores;
    for (const auto& cid : contentIds) {
        float dotProduct = 0.0f, userNorm = 0.0f, itemNorm = 0.0f;
        for (auto& [uid, row] : g_matrix) {
            float uVal = (row.count(userId) ? row.at(userId) : 0.0f);
            float iVal = (row.count(cid)    ? row.at(cid)    : 0.0f);
            dotProduct += uVal * iVal;
            userNorm   += uVal * uVal;
            itemNorm   += iVal * iVal;
        }
        float denom = std::sqrt(userNorm) * std::sqrt(itemNorm);
        scores.emplace_back(cid, denom > 0 ? dotProduct / denom : 0.0f);
    }

    std::sort(scores.begin(), scores.end(),
        [](auto& a, auto& b){ return a.second > b.second; });

    if (topK > 0 && (int)scores.size() > topK)
        scores.resize(topK);

    return scores;
}
```

---

### 5. gRPC Server Entry Point

`feature-engine-cpp/src/main.cpp`:

```cpp
#include <grpcpp/grpcpp.h>
#include "FeatureEngineServiceImpl.hpp"
#include <iostream>

int main() {
    std::string address("0.0.0.0:50051");
    FeatureEngineServiceImpl service;

    grpc::ServerBuilder builder;
    builder.AddListeningPort(address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);
    builder.RegisterService(
        grpc::reflection::experimental::BuildProtoServerReflectionPlugin()
    );

    auto server = builder.BuildAndStart();
    std::cout << "Feature Engine listening on " << address << "\n";
    server->Wait();
    return 0;
}
```

---

### 6. Build the Engine

```bash
cd feature-engine-cpp
cmake -B build \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/vcpkg/scripts/buildsystems/vcpkg.cmake \
  -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel $(nproc)
./build/feature_engine_server
```

---

### 7. Gateway — gRPC Client Integration

Add the gRPC Java stub to the gateway:

`gateway-service/pom.xml` (additions):

```xml
<dependencies>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-netty-shaded</artifactId>
    <version>1.62.2</version>
  </dependency>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-protobuf</artifactId>
    <version>1.62.2</version>
  </dependency>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
    <version>1.62.2</version>
  </dependency>
</dependencies>
```

Generate Java stubs from the proto (via `protobuf-maven-plugin`), then inject the gRPC channel:

```java
@Service
public class FeatureEngineClient {
    private final FeatureEngineGrpc.FeatureEngineBlockingStub stub;

    public FeatureEngineClient(@Value("${feature.engine.host:localhost}") String host,
                               @Value("${feature.engine.port:50051}") int port) {
        var channel = ManagedChannelBuilder.forAddress(host, port)
            .usePlaintext()
            .build();
        this.stub = FeatureEngineGrpc.newBlockingStub(channel);
    }

    public List<SimilarityScore> getSimilarityScores(
            String userId, List<String> contentIds, int topK) {
        var request = SimilarityRequest.newBuilder()
            .setUserId(userId)
            .addAllContentIds(contentIds)
            .setTopK(topK)
            .setMetric(SimilarityMetric.COSINE)
            .build();
        return stub.computeSimilarity(request).getScoresList();
    }
}
```

Wire this into `RecommendationController` to replace the random placeholder.

---

### 8. Dockerfile for Feature Engine

`feature-engine-cpp/Dockerfile`:

```dockerfile
FROM ubuntu:24.04 AS builder
RUN apt-get update && apt-get install -y \
    git cmake build-essential ninja-build \
    libgrpc++-dev libprotobuf-dev protobuf-compiler-grpc \
    libeigen3-dev pkg-config

WORKDIR /app
COPY . .
RUN cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --parallel

FROM ubuntu:24.04
RUN apt-get update && apt-get install -y libgrpc++1 libprotobuf32
COPY --from=builder /app/build/feature_engine_server /usr/local/bin/
EXPOSE 50051
ENTRYPOINT ["feature_engine_server"]
```

Add to `docker-compose.yml`:

```yaml
  feature-engine:
    build: ./feature-engine-cpp
    ports: ["50051:50051"]
```

---

## Definition of Done

- [ ] C++ project builds cleanly with CMake
- [ ] `feature_engine_server` listens on port `50051`
- [ ] `ComputeSimilarity` RPC returns scores (not random) based on ingested events
- [ ] `BatchUpdate` RPC ingests events and updates the in-memory matrix
- [ ] Gateway Java client successfully calls the Feature Engine via gRPC
- [ ] `/recommendations` endpoint returns scores from the Feature Engine (logged)
- [ ] Docker image for feature engine builds and runs inside Compose stack
- [ ] `grpcurl` or BloomRPC can successfully ping `Ping` RPC
- [ ] Unit tests cover `SimilarityComputer::computeCosine`
