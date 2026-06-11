# Phase 4 — Scala Akka Streams: Real-Time Event Processing

## Goal

Replace direct event persistence in the gateway with a real-time streaming pipeline. User interaction events flow from the gateway into a Kafka topic (or directly to an Akka HTTP endpoint), are windowed and aggregated by the Scala Stream Processor, and forwarded as batches to the C++ Feature Engine — keeping recommendation data continuously fresh.

---

## Prerequisites

- ✅ **Phase 1 complete** — gateway and ML service operational
- ✅ **Phase 3 complete** — Feature Engine accepting `BatchUpdate` gRPC calls
- JDK 21
- sbt 1.9+
- Scala 3.4+
- Kafka (via Docker Compose)

---

## Step-by-Step Setup

### 1. Add Kafka to Docker Compose

`docker-compose.yml` additions:

```yaml
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports: ["2181:2181"]

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    depends_on: [zookeeper]
    ports: ["9092:9092"]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
```

---

### 2. Gateway — Publish Events to Kafka

Add Kafka producer to `gateway-service`:

`pom.xml` addition:

```xml
<dependency>
  <groupId>org.springframework.kafka</groupId>
  <artifactId>spring-kafka</artifactId>
</dependency>
```

`application.yml` addition:

```yaml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BROKERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
```

`EventsController.java` — publish to Kafka on `POST /events`:

```java
@RestController
@RequestMapping("/events")
public class EventsController {

    private final KafkaTemplate<String, InteractionEvent> kafka;

    public EventsController(KafkaTemplate<String, InteractionEvent> kafka) {
        this.kafka = kafka;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> ingestEvent(
            @RequestBody InteractionEventDto dto,
            @AuthenticationPrincipal UserDetails user) {
        var event = new InteractionEvent(
            UUID.randomUUID().toString(),
            user.getUsername(),
            dto.contentId(),
            dto.eventType(),
            dto.weight(),
            Instant.now().toEpochMilli()
        );
        kafka.send("user-events", event.userId(), event);
        return ResponseEntity.accepted().body(Map.of("status", "queued"));
    }
}
```

---

### 3. Scala sbt Project

`stream-processor-scala/build.sbt`:

```scala
ThisBuild / scalaVersion := "3.4.1"
ThisBuild / version      := "0.1.0"

lazy val root = (project in file("."))
  .settings(
    name := "stream-processor",
    libraryDependencies ++= Seq(
      // Pekko (Apache Akka fork)
      "org.apache.pekko" %% "pekko-stream"       % "1.0.2",
      "org.apache.pekko" %% "pekko-actor-typed"  % "1.0.2",
      "org.apache.pekko" %% "pekko-http"         % "1.0.1",
      // Alpakka Kafka
      "org.apache.pekko" %% "pekko-connectors-kafka" % "1.0.0",
      // gRPC client (ScalaPB)
      "io.grpc"           % "grpc-netty"         % "1.62.2",
      "com.thesamet.scalapb" %% "scalapb-runtime-grpc" % scalapb.compiler.Version.scalapbVersion,
      // JSON
      "io.circe"         %% "circe-generic"      % "0.14.7",
      "io.circe"         %% "circe-parser"       % "0.14.7",
      // Logging
      "ch.qos.logback"    % "logback-classic"    % "1.5.6",
    ),
    // ScalaPB protobuf code generation
    Compile / PB.targets := Seq(
      scalapb.gen() -> (Compile / sourceManaged).value / "scalapb"
    ),
    Compile / PB.protoSources := Seq(
      (baseDirectory.value / ".." / "infra" / "proto").getCanonicalFile
    ),
  )
```

---

### 4. Event Model & JSON Codec

`src/main/scala/com/media/stream/model/InteractionEvent.scala`:

```scala
package com.media.stream.model

import io.circe.generic.semiauto.*
import io.circe.{Decoder, Encoder}

case class InteractionEvent(
  eventId:   String,
  userId:    String,
  contentId: String,
  eventType: String,
  weight:    Float,
  timestampMs: Long
)

object InteractionEvent:
  given Encoder[InteractionEvent] = deriveEncoder
  given Decoder[InteractionEvent] = deriveDecoder
```

---

### 5. Kafka Consumer + Akka Streams Pipeline

`src/main/scala/com/media/stream/StreamProcessor.scala`:

```scala
package com.media.stream

import org.apache.pekko.actor.typed.ActorSystem
import org.apache.pekko.actor.typed.scaladsl.Behaviors
import org.apache.pekko.kafka.{ConsumerSettings, Subscriptions}
import org.apache.pekko.kafka.scaladsl.Consumer
import org.apache.pekko.stream.scaladsl.*
import org.apache.kafka.common.serialization.StringDeserializer
import com.media.stream.model.InteractionEvent
import com.media.stream.grpc.FeatureEngineClient
import io.circe.parser.decode
import scala.concurrent.duration.*

object StreamProcessor extends App:

  given system: ActorSystem[Nothing] =
    ActorSystem(Behaviors.empty, "stream-processor")

  given ec: scala.concurrent.ExecutionContext = system.executionContext

  val kafkaBrokers = sys.env.getOrElse("KAFKA_BROKERS", "localhost:9092")

  val consumerSettings = ConsumerSettings(system, new StringDeserializer, new StringDeserializer)
    .withBootstrapServers(kafkaBrokers)
    .withGroupId("stream-processor-group")

  val featureEngineClient = FeatureEngineClient(
    sys.env.getOrElse("FEATURE_ENGINE_HOST", "localhost"),
    sys.env.getOrElse("FEATURE_ENGINE_PORT", "50051").toInt
  )

  Consumer
    .plainSource(consumerSettings, Subscriptions.topics("user-events"))
    .map { record =>
      decode[InteractionEvent](record.value()) match
        case Right(event) => Some(event)
        case Left(err)    =>
          system.log.warn(s"Failed to decode event: ${err.getMessage}")
          None
    }
    .collect { case Some(event) => event }
    // Tumbling window: batch events every 30 seconds or 500 events
    .groupedWithin(500, 30.seconds)
    // Forward aggregated batch to Feature Engine via gRPC
    .mapAsync(parallelism = 4) { batch =>
      featureEngineClient.batchUpdate(batch.toList)
        .map { response =>
          system.log.info(
            s"BatchUpdate: processed=${response.processedCount}, " +
            s"failed=${response.failedCount}"
          )
        }
    }
    .runWith(Sink.ignore)

  system.log.info("Stream Processor started, consuming 'user-events' topic")
```

---

### 6. gRPC Client Wrapper (ScalaPB)

`src/main/scala/com/media/stream/grpc/FeatureEngineClient.scala`:

```scala
package com.media.stream.grpc

import io.grpc.ManagedChannelBuilder
import media.feature.{
  FeatureEngineGrpc, BatchUpdateRequest, BatchUpdateResponse, InteractionEvent as ProtoEvent
}
import com.media.stream.model.InteractionEvent
import scala.concurrent.Future

class FeatureEngineClient(host: String, port: Int):

  private val channel = ManagedChannelBuilder
    .forAddress(host, port)
    .usePlaintext()
    .build()

  private val stub = FeatureEngineGrpc.stub(channel)

  def batchUpdate(events: List[InteractionEvent]): Future[BatchUpdateResponse] =
    val protoEvents = events.map { e =>
      ProtoEvent(
        userId      = e.userId,
        contentId   = e.contentId,
        `type`      = eventTypeFrom(e.eventType),
        weight      = e.weight,
        timestampMs = e.timestampMs
      )
    }
    stub.batchUpdate(BatchUpdateRequest(events = protoEvents))

  private def eventTypeFrom(s: String) = s.toLowerCase match
    case "view"     => media.feature.EventType.VIEW
    case "click"    => media.feature.EventType.CLICK
    case "rate"     => media.feature.EventType.RATE
    case "complete" => media.feature.EventType.COMPLETE
    case "skip"     => media.feature.EventType.SKIP
    case _          => media.feature.EventType.VIEW
```

---

### 7. Akka HTTP Ingest Endpoint (Kafka-free fallback)

For environments without Kafka, the processor exposes an HTTP endpoint:

```scala
// Add to StreamProcessor or a separate HttpIngestServer
import org.apache.pekko.http.scaladsl.Http
import org.apache.pekko.http.scaladsl.server.Directives.*

val route = path("ingest") {
  post {
    entity(as[String]) { body =>
      decode[InteractionEvent](body) match
        case Right(event) =>
          ingestQueue.offer(event)
          complete(StatusCodes.Accepted, """{"status":"queued"}""")
        case Left(err) =>
          complete(StatusCodes.BadRequest, err.getMessage)
    }
  }
}

Http().newServerAt("0.0.0.0", 8090).bind(route)
```

---

### 8. Dockerfile for Stream Processor

`stream-processor-scala/Dockerfile`:

```dockerfile
FROM sbtscala/scala-sbt:eclipse-temurin-21_1.9.9_3.4.1 AS builder
WORKDIR /app
COPY . .
RUN sbt assembly

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/scala-3.4.1/stream-processor-assembly-*.jar app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Add to `docker-compose.yml`:

```yaml
  stream-processor:
    build: ./stream-processor-scala
    ports: ["8090:8090"]
    depends_on: [kafka, feature-engine]
    environment:
      KAFKA_BROKERS: kafka:9092
      FEATURE_ENGINE_HOST: feature-engine
      FEATURE_ENGINE_PORT: "50051"
```

---

### 9. End-to-End Event Flow Test

```bash
# 1. Start the full stack
docker compose up --build

# 2. Log in and grab a token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"pass"}' \
  | jq -r .accessToken)

# 3. Emit a user interaction event
curl -X POST http://localhost:8080/events \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"eventType":"view","contentId":"c-001","weight":1.0}'

# 4. Wait 30 seconds (window duration), check Feature Engine logs
docker compose logs feature-engine --tail=20

# 5. Fetch updated recommendations
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/recommendations
```

---

## Definition of Done

- [ ] Kafka is running and `user-events` topic is created
- [ ] Gateway publishes events to `user-events` Kafka topic on `POST /events`
- [ ] Stream Processor consumes events from `user-events`
- [ ] Windowed aggregation batches events (30 s tumbling window)
- [ ] Aggregated batches are forwarded to Feature Engine via `BatchUpdate` gRPC
- [ ] Feature Engine updates in-memory similarity matrix on each batch
- [ ] Recommendations visibly improve after several interactions
- [ ] Stream Processor Docker image builds and runs inside Compose stack
- [ ] HTTP ingest fallback endpoint (`POST :8090/ingest`) works without Kafka
- [ ] All four services + Kafka run with a single `docker compose up`
- [ ] Logs show end-to-end event flow (gateway → Kafka → processor → engine)
