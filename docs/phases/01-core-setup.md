# Phase 1 — Core Setup: Gateway + ML Service Skeleton

## Goal

Bootstrap the foundational services so that a REST call to the gateway returns a (placeholder) recommendation list. By the end of this phase every service repository is scaffolded, and the two core services — the Java gateway and the Python ML service — are running end-to-end, even if recommendations are random.

---

## Prerequisites

- Docker ≥ 24 with Compose v2
- JDK 21 + Maven 3.9+
- Python 3.11+ + pip

> Scala, C++, and Node toolchains are **not** required in this phase — those services get placeholder stubs only.

---

## Step-by-Step Setup

### 1. Repository & Project Scaffolding

Create the top-level folder structure:

```bash
mkdir -p media-recommender/{frontend/src,frontend/public}
mkdir -p media-recommender/gateway-service/src/main/java/com/media/gateway
mkdir -p media-recommender/ml-service/{app,models}
mkdir -p media-recommender/feature-engine-cpp/{src,proto}
mkdir -p media-recommender/stream-processor-scala/src/main/scala
mkdir -p media-recommender/infra/{k8s,proto}
mkdir -p media-recommender/docs/phases
```

Initialise Git and add `.gitignore`:

```bash
cd media-recommender
git init
# (copy .gitignore from repo root)
```

---

### 2. Gateway Service (Java Spring Boot)

#### 2.1 Create Spring Boot project

Use [Spring Initializr](https://start.spring.io/) or the CLI:

```bash
# Using Spring CLI
spring init \
  --dependencies=web,security,data-jpa,postgresql,validation \
  --build=maven \
  --java-version=21 \
  --artifact-id=gateway-service \
  --group-id=com.media \
  gateway-service
```

#### 2.2 Configure `application.yml`

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mediadb
    username: ${DB_USER:media}
    password: ${DB_PASS:media}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

ml:
  service:
    url: ${ML_SERVICE_URL:http://localhost:8000}

jwt:
  secret: ${JWT_SECRET:changeme-in-production-32chars}
  expiry-seconds: 3600
```

#### 2.3 Implement placeholder endpoints

Create `RecommendationController.java`:

```java
@RestController
@RequestMapping("/recommendations")
public class RecommendationController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit) {
        // Phase 1: random placeholder IDs
        List<String> ids = IntStream.range(0, limit)
            .mapToObj(i -> "c-" + String.format("%03d", (int)(Math.random() * 999)))
            .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("recommendations", ids));
    }
}
```

#### 2.4 Implement Auth skeleton

- Add `JwtUtil`, `UserDetailsServiceImpl`, `SecurityConfig` (permit `/auth/**`, secure everything else).
- `POST /auth/register` and `POST /auth/login` endpoints returning a hardcoded or real JWT.

#### 2.5 Run gateway locally

```bash
cd gateway-service
mvn spring-boot:run
# Test: curl http://localhost:8080/recommendations
```

---

### 3. ML Service (Python FastAPI)

#### 3.1 Create project structure

```
ml-service/
├── app/
│   ├── main.py
│   ├── routers/
│   │   └── recommend.py
│   └── models/
│       └── placeholder.py
├── models/           # serialised model files (empty for now)
└── requirements.txt
```

#### 3.2 `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
pydantic==2.7.0
scikit-learn==1.4.2
numpy==1.26.4
torch==2.3.0
```

#### 3.3 Implement placeholder recommender

`app/main.py`:
```python
from fastapi import FastAPI
from app.routers import recommend

app = FastAPI(title="ML Service", version="0.1.0")
app.include_router(recommend.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

`app/routers/recommend.py`:
```python
import random
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/recommend", tags=["recommend"])

class RecommendRequest(BaseModel):
    user_id: str
    limit: int = 10
    algorithm: str = "mf"

class RecommendResponse(BaseModel):
    user_id: str
    content_ids: List[str]
    algorithm: str

@router.post("/", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    # Phase 1: random placeholder
    ids = [f"c-{random.randint(1, 999):03d}" for _ in range(req.limit)]
    return RecommendResponse(user_id=req.user_id, content_ids=ids, algorithm=req.algorithm)
```

#### 3.4 Run ML service locally

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Test: curl -X POST http://localhost:8000/recommend/ \
#   -H 'Content-Type: application/json' \
#   -d '{"user_id":"u1","limit":5}'
```

---

### 4. Docker Compose for Phase 1

`docker-compose.yml` (root):

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: mediadb
      POSTGRES_USER: media
      POSTGRES_PASSWORD: media
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  gateway:
    build: ./gateway-service
    ports: ["8080:8080"]
    depends_on: [postgres]
    environment:
      DB_USER: media
      DB_PASS: media
      ML_SERVICE_URL: http://ml-service:8000
      JWT_SECRET: changeme-in-dev-only

  ml-service:
    build: ./ml-service
    ports: ["8000:8000"]

volumes:
  pgdata:
```

Run:

```bash
docker compose up --build
```

---

### 5. Placeholder Stubs for Other Services

Create minimal `README.md` stubs and empty source files so every repo compiles cleanly in later phases:

| Service              | Files to create                                     |
|----------------------|-----------------------------------------------------|
| `frontend/`          | `package.json` (empty React project via Vite)       |
| `feature-engine-cpp/`| `CMakeLists.txt`, `src/main.cpp`, `proto/.gitkeep`  |
| `stream-processor-scala/` | `build.sbt`, `src/main/scala/Main.scala`       |

---

## Definition of Done

- [ ] Gateway runs on port 8080 and responds to `GET /recommendations`
- [ ] `POST /auth/login` returns a valid JWT
- [ ] ML service runs on port 8000 and responds to `POST /recommend/`
- [ ] Gateway calls ML service and returns enriched recommendation list
- [ ] `docker compose up` starts both services without errors
- [ ] PostgreSQL is reachable and gateway connects successfully
- [ ] All other service directories have skeleton files committed to Git
- [ ] `GET /health` returns `{"status":"ok"}` on both services
