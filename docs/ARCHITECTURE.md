# Architecture — Smart Media Recommender Platform

This document describes each service's responsibility, the data flow between services, and the communication contracts (REST and gRPC) used to wire them together.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Services](#2-services)
   - [Frontend](#21-frontend-react--typescript)
   - [Gateway Service](#22-gateway-service-java-spring-boot)
   - [ML Service](#23-ml-service-python-fastapi)
   - [Feature Engine](#24-feature-engine-c-grpc)
   - [Stream Processor](#25-stream-processor-scala--akka-streams)
3. [Data Flows](#3-data-flows)
   - [User Login & Token Issuance](#31-user-login--token-issuance)
   - [Recommendation Request](#32-recommendation-request)
   - [User Interaction Events](#33-user-interaction-events)
   - [Similarity Computation](#34-similarity-computation)
4. [Communication Contracts](#4-communication-contracts)
5. [Persistence Layer](#5-persistence-layer)
6. [Observability](#6-observability)
7. [Deployment Topology](#7-deployment-topology)

---

## 1. System Overview

```
                           ┌─────────────────────────────────┐
                           │         Browser / Mobile        │
                           └──────────────┬──────────────────┘
                                          │ HTTPS REST + WS
                           ┌──────────────▼──────────────────┐
                           │      Gateway Service (Java)     │
                           │  Spring Boot 3 · Spring Security│
                           │  JWT auth · rate limiting       │
                           │  user/content/ratings management│
                           └────┬──────────────┬─────────────┘
                      REST/JSON │              │ gRPC (TLS)
               ┌────────────────▼─┐     ┌─────▼──────────────────┐
               │  ML Service (Py) │     │  Feature Engine (C++)  │
               │  FastAPI · KNN   │     │  gRPC server · Eigen   │
               │  Matrix Factor.  │     │  similarity matrices   │
               │  Neural CF       │     │  feature vectors       │
               └──────────────────┘     └────────────────────────┘
                                                  ▲
                                    aggregated    │
                                    batches       │
                            ┌─────────────────────┴───────────┐
                            │   Stream Processor (Scala)      │
                            │   Akka Streams · Kafka consumer │
                            │   event aggregation · windowing │
                            └──────────────▲──────────────────┘
                                          │ Kafka / Akka HTTP
                           ┌──────────────┴──────────────────┐
                           │   Gateway + Frontend (producers)│
                           └─────────────────────────────────┘
```

---

## 2. Services

### 2.1 Frontend (React + TypeScript)

**Location:** `/frontend`

**Responsibility:**
- Single-page application (SPA) providing the user interface.
- Renders a content catalogue, user profile, personalised recommendation list, and a rating interface.
- Authenticates users via JWT tokens stored in `httpOnly` cookies or `sessionStorage`.
- Emits user interaction events (view, click, rating) directly to the Gateway REST API or via WebSocket.

**Key interactions:**
| Upstream             | Protocol        |
|----------------------|-----------------|
| Gateway Service      | REST/JSON       |
| Gateway Service      | WebSocket (live updates) |

**Technology choices:**
- React 18 with TypeScript 5
- Vite for bundling and HMR
- React Query for server-state management
- React Router v6 for client-side routing

---

### 2.2 Gateway Service (Java Spring Boot)

**Location:** `/gateway-service`

**Responsibility:**
- Single entry point for all external traffic.
- Handles JWT-based authentication and authorisation (Spring Security).
- Exposes REST APIs for: auth, user management, content catalogue, ratings, and recommendations.
- Proxies recommendation requests to the ML Service.
- Calls the Feature Engine via gRPC to request similarity score updates.
- Publishes user interaction events to the Stream Processor (Kafka topic or Akka HTTP endpoint).

**Key interactions:**
| Downstream             | Protocol        |
|------------------------|-----------------|
| ML Service             | REST/JSON (HTTP client) |
| Feature Engine (C++)   | gRPC over TLS   |
| Stream Processor       | Kafka / HTTP    |
| PostgreSQL             | JDBC / JPA      |

**Technology choices:**
- Spring Boot 3.3
- Spring Security 6 (OAuth2 Resource Server, JWT)
- Spring Data JPA + PostgreSQL
- Reactive WebClient (for ML Service calls)
- gRPC Java stub (generated from shared `.proto`)

---

### 2.3 ML Service (Python FastAPI)

**Location:** `/ml-service`

**Responsibility:**
- Hosts and serves recommendation models.
- Supports three algorithm modes selectable at runtime:
  - **KNN** — item-based K-Nearest Neighbours
  - **MF** — Matrix Factorisation (ALS or SVD)
  - **NCF** — Neural Collaborative Filtering (PyTorch)
- Receives a `user_id` + optional context from the Gateway, returns ranked `content_id` list.
- Reloads updated feature vectors pushed from the Feature Engine (via file share or internal API).
- Exposes an internal admin endpoint to trigger model retraining.

**Key interactions:**
| Upstream        | Protocol   |
|-----------------|------------|
| Gateway Service | REST/JSON  |

**Technology choices:**
- Python 3.11 + FastAPI 0.111
- PyTorch 2 (NCF)
- scikit-learn (KNN, MF)
- Pydantic v2 for request validation
- Uvicorn ASGI server

---

### 2.4 Feature Engine (C++ gRPC)

**Location:** `/feature-engine-cpp`

**Responsibility:**
- High-performance computation of similarity matrices and feature vectors.
- Accepts batches of user-item interaction events from the Stream Processor or Gateway.
- Computes cosine similarity, dot-product embeddings, or custom distance metrics over sparse matrices.
- Serialises results and writes them to shared storage (NFS volume or object store) for the ML Service to consume.
- Exposes a gRPC service (`FeatureEngine`) described in `/infra/proto/feature_engine.proto`.

**Key interactions:**
| Upstream              | Protocol    |
|-----------------------|-------------|
| Gateway Service       | gRPC        |
| Stream Processor      | Aggregated batch (file / gRPC) |

**Technology choices:**
- C++20
- gRPC 1.62 + protobuf 25
- Eigen3 for linear algebra
- CMake 3.25+ build system

---

### 2.5 Stream Processor (Scala + Akka Streams)

**Location:** `/stream-processor-scala`

**Responsibility:**
- Consumes raw user interaction events (views, clicks, ratings) from a Kafka topic or an Akka HTTP ingest endpoint.
- Applies windowed aggregation (tumbling or sliding windows) to batch interaction events.
- Forwards aggregated interaction batches to the Feature Engine for similarity recomputation.
- Optionally writes raw events to a data lake (S3 / GCS) for offline training.

**Key interactions:**
| Upstream                    | Protocol        |
|-----------------------------|-----------------|
| Gateway Service / Frontend  | Kafka / HTTP    |

| Downstream        | Protocol |
|-------------------|----------|
| Feature Engine    | gRPC / file batch |
| Data Lake         | S3 / GCS SDK   |

**Technology choices:**
- Scala 3.4
- Akka Streams 2.9 (Apache licence fork: Pekko)
- Alpakka Kafka connector
- Akka HTTP (ingest endpoint fallback)
- sbt 1.9

---

## 3. Data Flows

### 3.1 User Login & Token Issuance

```
Frontend  ──POST /auth/login──►  Gateway
                                  │ Validates credentials (PostgreSQL)
                                  │ Issues JWT (access + refresh tokens)
          ◄── 200 OK + JWT ───────┘
```

### 3.2 Recommendation Request

```
Frontend  ──GET /recommendations?userId=X──►  Gateway
                                               │ Validates JWT
                                               │ POST http://ml-service/recommend
                                               │   { user_id, limit, algorithm }
                                               │
                       ML Service  ◄───────────┘
                           │  Runs KNN / MF / NCF model
                           │  Returns ranked content_ids
                       Gateway  ◄──────────────
                           │  Enriches with content metadata (DB)
Frontend  ◄── 200 OK + recommendations ─────────
```

### 3.3 User Interaction Events

```
Frontend  ──POST /events──►  Gateway
                               │ Publishes to Kafka topic `user-events`
                               │
               Stream Processor ◄── Kafka consumer
                   │  Windowed aggregation (e.g., 5-min tumbling)
                   │
               Feature Engine (C++) ◄── gRPC BatchUpdateRequest
                   │  Recomputes similarity scores
                   │  Writes updated vectors to shared volume
                   │
               ML Service ◄── polls / file-watch for new vectors
                   │  Hot-reloads model features
```

### 3.4 Similarity Computation

```
Gateway  ──gRPC ComputeSimilarity──►  Feature Engine
                                        │ Loads interaction matrix
                                        │ Runs cosine similarity
                                        │ Returns SimilarityResponse
Gateway  ◄── SimilarityResponse ────────
```

---

## 4. Communication Contracts

See [API_CONTRACTS.md](API_CONTRACTS.md) for:
- Full REST endpoint definitions for the Gateway Service
- gRPC `.proto` service definition for the Feature Engine

---

## 5. Persistence Layer

| Store          | Used by               | Purpose                            |
|----------------|-----------------------|------------------------------------|
| PostgreSQL     | Gateway Service       | Users, content catalogue, ratings  |
| Redis          | Gateway Service       | JWT refresh token store, rate limit|
| Shared Volume  | Feature Engine + ML   | Pre-computed feature/vector files  |
| Kafka          | Gateway → Stream Proc | User interaction event stream      |
| S3 / GCS       | Stream Processor      | Raw event archive (optional)       |

---

## 6. Observability

All services expose:
- **Health endpoints** — `/health` (HTTP 200/503)
- **Metrics** — Prometheus-compatible `/metrics` endpoint
- **Structured Logging** — JSON logs to stdout, collected by Fluentd / Loki

Distributed tracing via OpenTelemetry (W3C TraceContext) will be added in a future phase.

---

## 7. Deployment Topology

### Local (Docker Compose)

All services run as Docker containers on the same bridge network. See `docker-compose.yml`.

### Production (Kubernetes)

Kubernetes manifests live in `/infra/k8s/`. Each service gets its own `Deployment`, `Service`, and `HorizontalPodAutoscaler`. Secrets are managed via Kubernetes `Secret` objects (or an external secrets manager).

| Resource              | Replicas (prod suggestion) |
|-----------------------|---------------------------|
| Frontend              | 2 (static, Nginx)         |
| Gateway Service       | 3                         |
| ML Service            | 2                         |
| Feature Engine        | 2                         |
| Stream Processor      | 2                         |
| Kafka                 | 3 brokers                 |
| PostgreSQL            | 1 primary + 1 replica     |
