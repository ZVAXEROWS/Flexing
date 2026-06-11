# 🎬 Smart Media Recommender Platform

A production-grade, polyglot media recommendation engine combining a Java API gateway, Python ML models, a C++ feature-computation engine, and a Scala real-time stream processor — all wired together via REST, gRPC, and Kafka.

---

## Table of Contents

- [Overview](#overview)
- [Architecture Summary](#architecture-summary)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Running the Stack](#running-the-stack)
- [Development Phases](#development-phases)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Smart Media Recommender Platform delivers personalised movie, show, and podcast recommendations to users. It is designed with a microservices architecture, intentionally polyglot to leverage the best tool for each concern:

| Concern                     | Technology              |
|-----------------------------|-------------------------|
| User-facing UI              | React + TypeScript      |
| API gateway / auth / routing| Java Spring Boot        |
| Recommendation models       | Python FastAPI          |
| Similarity / feature vectors| C++ gRPC service        |
| Real-time event ingestion   | Scala + Akka Streams    |
| Orchestration               | Docker Compose / K8s    |

---

## Architecture Summary

```
 Browser
   │  REST/JSON (+ optional WebSocket)
   ▼
┌─────────────────────────┐
│  Gateway Service (Java) │  ← Auth, routing, user/ratings management
└────────┬────────────────┘
         │ REST/JSON          │ gRPC (protobuf)
         ▼                   ▼
┌─────────────────┐  ┌──────────────────────────┐
│  ML Service     │  │  Feature Engine (C++)    │
│  (Python/FastAPI│  │  similarity matrices,    │
│   KNN, MF, NCF) │  │  feature vectors         │
└─────────────────┘  └──────────────────────────┘
                                  ▲
         ┌────────────────────────┘  aggregated batches
         │
┌────────────────────────────┐
│  Stream Processor (Scala)  │  ← Kafka / Akka HTTP events
│  Akka Streams, real-time   │    from Frontend & Gateway
└────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a full breakdown.

---

## Repository Structure

```
media-recommender/
├── frontend/                   # React + TypeScript SPA
│   ├── src/
│   ├── public/
│   └── package.json
├── gateway-service/            # Java Spring Boot – API gateway, auth, routing
│   ├── src/main/java/
│   └── pom.xml
├── ml-service/                 # Python FastAPI – recommendation models
│   ├── app/
│   ├── models/
│   └── requirements.txt
├── feature-engine-cpp/         # C++ gRPC – similarity/feature computations
│   ├── src/
│   ├── proto/
│   └── CMakeLists.txt
├── stream-processor-scala/     # Scala + Akka Streams – event stream processing
│   ├── src/main/scala/
│   └── build.sbt
├── infra/                      # docker-compose, K8s manifests, shared .proto
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   └── phases/
│       ├── 01-core-setup.md
│       ├── 02-frontend-ui.md
│       ├── 03-cpp-engine.md
│       └── 04-scala-streaming.md
├── docker-compose.yml
├── .gitignore
└── LICENSE
```

---

## Prerequisites

Install **all** of the following before attempting a full local run:

### Node.js (Frontend)
| Requirement | Version     |
|-------------|-------------|
| Node.js     | ≥ 20 LTS    |
| npm         | ≥ 10        |

```bash
node --version
npm --version
```

### Java (Gateway Service)
| Requirement | Version |
|-------------|---------|
| JDK         | 21 LTS  |
| Maven       | 3.9+    |

```bash
java --version
mvn --version
```

### Python (ML Service)
| Requirement | Version |
|-------------|---------|
| Python      | 3.11+   |
| pip         | 23+     |

```bash
python --version
pip --version
```

### C++ (Feature Engine)
| Requirement | Notes                         |
|-------------|-------------------------------|
| GCC / Clang | ≥ GCC 12 or Clang 16          |
| CMake       | ≥ 3.25                        |
| gRPC        | 1.62+ (via vcpkg or Conan)    |
| Protobuf    | 25+                           |

```bash
cmake --version
g++ --version
```

### Scala (Stream Processor)
| Requirement | Version |
|-------------|---------|
| JDK         | 21 LTS  |
| sbt         | 1.9+    |
| Scala       | 3.4+    |

```bash
sbt --version
```

### Infrastructure
| Requirement    | Notes                    |
|----------------|--------------------------|
| Docker         | ≥ 24                     |
| Docker Compose | v2 plugin (`docker compose`) |

```bash
docker --version
docker compose version
```

---

## Running the Stack

### 1. Clone the repository

```bash
git clone https://github.com/your-org/media-recommender.git
cd media-recommender
```

### 2. Configure environment

Copy the example env files and populate secrets:

```bash
cp gateway-service/.env.example gateway-service/.env
cp ml-service/.env.example ml-service/.env
```

### 3. Start with Docker Compose

```bash
docker compose up --build
```

This will build and start:

| Service              | Port  |
|----------------------|-------|
| Frontend             | 3000  |
| Gateway (REST)       | 8080  |
| ML Service           | 8000  |
| Feature Engine (gRPC)| 50051 |
| Stream Processor     | 8090  |
| Kafka (if enabled)   | 9092  |

### 4. Open the app

Navigate to [http://localhost:3000](http://localhost:3000).

### 5. Stop the stack

```bash
docker compose down
```

To also remove volumes (wipes DB data):

```bash
docker compose down -v
```

---

## Development Phases

| Phase | Doc                                          | Goal                                     |
|-------|----------------------------------------------|------------------------------------------|
| 1     | [01-core-setup.md](docs/phases/01-core-setup.md)       | Gateway + ML service skeleton            |
| 2     | [02-frontend-ui.md](docs/phases/02-frontend-ui.md)     | React UI consuming gateway API           |
| 3     | [03-cpp-engine.md](docs/phases/03-cpp-engine.md)       | C++ feature engine via gRPC              |
| 4     | [04-scala-streaming.md](docs/phases/04-scala-streaming.md) | Scala/Akka Streams event processing  |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a pull request against `main`

Please read `CONTRIBUTING.md` (coming soon) for detailed guidelines.

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
