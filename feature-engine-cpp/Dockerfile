FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    git cmake build-essential ninja-build \
    libgrpc++-dev libprotobuf-dev protobuf-compiler-grpc \
    pkg-config

WORKDIR /app
COPY . .

RUN mkdir -p /app/build/proto && \
    protoc -I proto --cpp_out=/app/build/proto --grpc_out=/app/build/proto --plugin=protoc-gen-grpc=/usr/bin/grpc_cpp_plugin proto/feature_engine.proto && \
    g++ -std=c++20 -O2 \
      src/main.cpp \
      src/FeatureEngineServiceImpl.cpp \
      src/SimilarityComputer.cpp \
      /app/build/proto/feature_engine.pb.cc \
      /app/build/proto/feature_engine.grpc.pb.cc \
      -I src -I /app/build \
      -lgrpc++ -lgrpc++_reflection -lprotobuf -lpthread \
      -o /app/build/feature_engine_server

FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libgrpc++1.51t64 libprotobuf32t64 ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build/feature_engine_server /usr/local/bin/feature_engine_server

EXPOSE 50051
ENTRYPOINT ["/usr/local/bin/feature_engine_server"]
