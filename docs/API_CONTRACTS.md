# API Contracts — Smart Media Recommender Platform

This document defines:
1. **REST API** — all Gateway Service endpoints
2. **gRPC API** — Feature Engine proto definition

Base URL (local): `http://localhost:8080`

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Content](#content)
- [Ratings](#ratings)
- [Recommendations](#recommendations)
- [Events](#events)
- [gRPC — Feature Engine](#grpc--feature-engine)

---

## Authentication

### POST `/auth/register`

Register a new user account.

**Request Body**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secureP@ssw0rd"
}
```

**Response `201 Created`**
```json
{
  "userId": "uuid-v4",
  "username": "alice",
  "email": "alice@example.com",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Errors:** `400 Bad Request` (validation), `409 Conflict` (email taken)

---

### POST `/auth/login`

Authenticate and receive JWT tokens.

**Request Body**
```json
{
  "email": "alice@example.com",
  "password": "secureP@ssw0rd"
}
```

**Response `200 OK`**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "dGhpcyBp...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

**Errors:** `401 Unauthorized`

---

### POST `/auth/refresh`

Exchange a refresh token for a new access token.

**Request Body**
```json
{
  "refreshToken": "dGhpcyBp..."
}
```

**Response `200 OK`**
```json
{
  "accessToken": "eyJuZXcu...",
  "expiresIn": 3600
}
```

---

### POST `/auth/logout`

Invalidate the current refresh token. Requires `Authorization: Bearer <token>`.

**Response `204 No Content`**

---

## Users

All endpoints require `Authorization: Bearer <accessToken>`.

### GET `/users/me`

Fetch the authenticated user's profile.

**Response `200 OK`**
```json
{
  "userId": "uuid-v4",
  "username": "alice",
  "email": "alice@example.com",
  "preferences": {
    "genres": ["sci-fi", "thriller"],
    "language": "en"
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### PATCH `/users/me`

Update the authenticated user's profile or preferences.

**Request Body**
```json
{
  "username": "alice_updated",
  "preferences": {
    "genres": ["comedy", "drama"]
  }
}
```

**Response `200 OK`** — updated user object.

---

### DELETE `/users/me`

Delete the authenticated user's account.

**Response `204 No Content`**

---

## Content

### GET `/content`

List available media content with optional filters and pagination.

**Query Parameters**

| Parameter  | Type    | Description                            |
|------------|---------|----------------------------------------|
| `genre`    | string  | Filter by genre slug                   |
| `type`     | string  | `movie` \| `show` \| `podcast`         |
| `query`    | string  | Full-text search on title/description  |
| `page`     | integer | Page number (default: 1)               |
| `size`     | integer | Items per page (default: 20, max: 100) |

**Response `200 OK`**
```json
{
  "data": [
    {
      "contentId": "c-001",
      "title": "Interstellar",
      "type": "movie",
      "genre": ["sci-fi", "drama"],
      "releaseYear": 2014,
      "rating": 8.6,
      "posterUrl": "https://cdn.example.com/posters/c-001.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalItems": 1240,
    "totalPages": 62
  }
}
```

---

### GET `/content/{contentId}`

Fetch detailed metadata for a single content item.

**Response `200 OK`**
```json
{
  "contentId": "c-001",
  "title": "Interstellar",
  "type": "movie",
  "genre": ["sci-fi", "drama"],
  "releaseYear": 2014,
  "director": "Christopher Nolan",
  "cast": ["Matthew McConaughey", "Anne Hathaway"],
  "description": "A team of explorers travel through a wormhole...",
  "duration": 169,
  "language": "en",
  "rating": 8.6,
  "posterUrl": "https://cdn.example.com/posters/c-001.jpg"
}
```

**Errors:** `404 Not Found`

---

## Ratings

Requires `Authorization: Bearer <accessToken>`.

### POST `/ratings`

Submit or update a rating for a content item.

**Request Body**
```json
{
  "contentId": "c-001",
  "score": 4.5
}
```
`score` must be between `0.5` and `5.0` (increments of 0.5).

**Response `201 Created`**
```json
{
  "ratingId": "r-uuid",
  "userId": "uuid-v4",
  "contentId": "c-001",
  "score": 4.5,
  "createdAt": "2024-01-15T11:00:00Z"
}
```

---

### GET `/ratings/me`

Fetch all ratings submitted by the authenticated user.

**Response `200 OK`**
```json
{
  "data": [
    { "ratingId": "r-uuid", "contentId": "c-001", "score": 4.5 }
  ]
}
```

---

### DELETE `/ratings/{ratingId}`

Delete a specific rating.

**Response `204 No Content`**

---

## Recommendations

Requires `Authorization: Bearer <accessToken>`.

### GET `/recommendations`

Fetch personalised recommendations for the authenticated user.

**Query Parameters**

| Parameter    | Type    | Description                                       |
|--------------|---------|---------------------------------------------------|
| `algorithm`  | string  | `knn` \| `mf` \| `ncf` (default: `mf`)           |
| `limit`      | integer | Number of recommendations (default: 10, max: 50) |
| `type`       | string  | Filter by content type                            |
| `genre`      | string  | Filter by genre                                   |

**Response `200 OK`**
```json
{
  "userId": "uuid-v4",
  "algorithm": "mf",
  "generatedAt": "2024-01-15T11:05:00Z",
  "recommendations": [
    {
      "rank": 1,
      "contentId": "c-042",
      "title": "Arrival",
      "score": 0.97,
      "reason": "Based on your rating of Interstellar"
    }
  ]
}
```

---

### GET `/recommendations/similar/{contentId}`

Find content similar to a given item (item-based similarity).

**Query Parameters:** `limit` (default 10)

**Response `200 OK`** — same shape as `/recommendations`.

---

## Events

### POST `/events`

Ingest a user interaction event. Used by the frontend to signal views, clicks, or completions. Requires auth.

**Request Body**
```json
{
  "eventType": "view",
  "contentId": "c-001",
  "duration": 320,
  "timestamp": "2024-01-15T11:10:00Z",
  "metadata": {
    "source": "recommendation_list",
    "position": 2
  }
}
```

`eventType` values: `view` | `click` | `rate` | `complete` | `skip`

**Response `202 Accepted`**
```json
{ "eventId": "evt-uuid", "status": "queued" }
```

---

## gRPC — Feature Engine

### Proto file location

```
/infra/proto/feature_engine.proto
/feature-engine-cpp/proto/feature_engine.proto   (symlink)
/gateway-service/src/main/proto/feature_engine.proto  (symlink)
```

### Proto Definition

```protobuf
syntax = "proto3";

package media.feature;

option java_package = "com.media.feature";
option java_multiple_files = true;

// ───────────────────────────────────────────────
// Service definition
// ───────────────────────────────────────────────

service FeatureEngine {

  // Request similarity scores for a single user against a list of content items
  rpc ComputeSimilarity (SimilarityRequest) returns (SimilarityResponse);

  // Push a batch of user-item interactions to trigger feature recomputation
  rpc BatchUpdate (BatchUpdateRequest) returns (BatchUpdateResponse);

  // Retrieve the feature vector for a specific content item
  rpc GetFeatureVector (FeatureVectorRequest) returns (FeatureVectorResponse);

  // Stream similarity computations for multiple users (server-streaming)
  rpc StreamSimilarities (stream SimilarityRequest) returns (stream SimilarityResponse);

  // Health check
  rpc Ping (PingRequest) returns (PingResponse);
}

// ───────────────────────────────────────────────
// Messages
// ───────────────────────────────────────────────

message SimilarityRequest {
  string user_id    = 1;
  repeated string content_ids = 2;  // items to score against
  SimilarityMetric metric       = 3;  // algorithm to use
  int32 top_k                   = 4;  // return only top-k results
}

message SimilarityResponse {
  string user_id = 1;
  repeated SimilarityScore scores = 2;
  int64 computed_at_ms            = 3;  // unix millis
}

message SimilarityScore {
  string content_id = 1;
  float score       = 2;  // 0.0 – 1.0
}

message BatchUpdateRequest {
  repeated InteractionEvent events = 1;
}

message BatchUpdateResponse {
  int32 processed_count = 1;
  int32 failed_count    = 2;
  repeated string errors = 3;
}

message InteractionEvent {
  string user_id    = 1;
  string content_id = 2;
  EventType type    = 3;
  float weight      = 4;  // e.g. 1.0 for view, 5.0 for rating
  int64 timestamp_ms = 5;
}

message FeatureVectorRequest {
  string content_id = 1;
  int32 dimensions  = 2;  // 0 = use engine default
}

message FeatureVectorResponse {
  string content_id     = 1;
  repeated float vector = 2;
  int32 dimensions      = 3;
}

message PingRequest {}

message PingResponse {
  string status  = 1;  // "OK"
  string version = 2;
}

// ───────────────────────────────────────────────
// Enums
// ───────────────────────────────────────────────

enum SimilarityMetric {
  COSINE       = 0;
  DOT_PRODUCT  = 1;
  EUCLIDEAN    = 2;
}

enum EventType {
  VIEW     = 0;
  CLICK    = 1;
  RATE     = 2;
  COMPLETE = 3;
  SKIP     = 4;
}
```

### Error Codes

| gRPC Status Code   | Meaning                                          |
|--------------------|--------------------------------------------------|
| `OK`               | Success                                          |
| `INVALID_ARGUMENT` | Malformed request (missing fields, bad IDs)      |
| `NOT_FOUND`        | User or content ID not in the interaction matrix |
| `RESOURCE_EXHAUSTED` | Rate limit exceeded                            |
| `INTERNAL`         | Engine computation failure                       |
| `UNAVAILABLE`      | Engine is starting up or under heavy load        |
