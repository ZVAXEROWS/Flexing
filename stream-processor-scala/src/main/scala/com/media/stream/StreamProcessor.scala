package com.media.stream

import org.apache.pekko.actor.typed.ActorSystem
import org.apache.pekko.actor.typed.scaladsl.Behaviors
import org.apache.pekko.kafka.{ConsumerSettings, Subscriptions}
import org.apache.pekko.kafka.scaladsl.Consumer
import org.apache.pekko.stream.{OverflowStrategy, QueueOfferResult}
import org.apache.pekko.stream.scaladsl.*
import org.apache.pekko.http.scaladsl.Http
import org.apache.pekko.http.scaladsl.model.*
import org.apache.pekko.http.scaladsl.server.Directives.*
import org.apache.kafka.common.serialization.StringDeserializer
import com.media.stream.model.InteractionEvent
import com.media.stream.grpc.FeatureEngineClient
import io.circe.parser.decode
import io.circe.syntax.*
import scala.concurrent.{Future, ExecutionContext}
import scala.concurrent.duration.*
import scala.util.{Success, Failure}
import org.slf4j.LoggerFactory

class StreamProcessor(
  kafkaBrokers: String,
  featureEngineHost: String,
  featureEnginePort: Int,
  httpPort: Int = 8090
)(using system: ActorSystem[Nothing]):

  private val logger = LoggerFactory.getLogger(getClass)
  private given ec: ExecutionContext = system.executionContext

  private val featureEngineClient = FeatureEngineClient(featureEngineHost, featureEnginePort)

  // 1. HTTP Ingest Queue Source (Pekko Stream SourceQueueWithComplete)
  private val (ingestQueue, queueSource) = Source
    .queue[InteractionEvent](bufferSize = 2048, overflowStrategy = OverflowStrategy.dropHead)
    .preMaterialize()

  // 2. Kafka Consumer Source
  private val consumerSettings = ConsumerSettings(system, new StringDeserializer, new StringDeserializer)
    .withBootstrapServers(kafkaBrokers)
    .withGroupId("stream-processor-group")

  private val kafkaSource = Consumer
    .plainSource(consumerSettings, Subscriptions.topics("user-events"))
    .map { record =>
      decode[InteractionEvent](record.value()) match
        case Right(event) =>
          logger.debug(s"Decoded Kafka event: ${event.eventId} for user: ${event.userId}")
          Some(event)
        case Left(err) =>
          logger.warn(s"Failed to decode Kafka record JSON: ${err.getMessage}")
          None
    }
    .collect { case Some(event) => event }
    .recoverWithRetries(-1, { case ex: Throwable =>
      logger.warn(s"Kafka source reconnecting: ${ex.getMessage}")
      Source.empty
    })

  def start(): Unit =
    logger.info("Initializing Pekko Streams Real-Time Event Processing Pipeline...")

    // 3. Merge Kafka & HTTP Ingest Sources, Batch & Dispatch via gRPC
    Source.combine(kafkaSource, queueSource)(Merge(_))
      // Tumbling window: aggregate up to 500 events or every 30 seconds
      .groupedWithin(500, 30.seconds)
      .filter(_.nonEmpty)
      .mapAsync(parallelism = 4) { batch =>
        logger.info(s"Aggregated window batch of ${batch.size} events. Forwarding to C++ Feature Engine...")
        featureEngineClient.batchUpdate(batch.toList).map { response =>
          logger.info(s"BatchUpdate complete: processed=${response.processedCount}, failed=${response.failedCount}")
          response
        }
      }
      .runWith(Sink.ignore)

    // 4. Start HTTP Ingest Server
    startHttpServer()

  private def startHttpServer(): Unit =
    val route = concat(
      path("health") {
        get {
          complete(HttpEntity(ContentTypes.`application/json`, """{"status":"UP","service":"stream-processor"}"""))
        }
      },
      path("ingest") {
        post {
          entity(as[String]) { rawJson =>
            decode[InteractionEvent](rawJson) match
              case Right(event) =>
                ingestQueue.offer(event).map {
                  case QueueOfferResult.Enqueued =>
                    StatusCodes.Accepted -> """{"status":"queued"}"""
                  case QueueOfferResult.Dropped =>
                    StatusCodes.TooManyRequests -> """{"status":"dropped","reason":"buffer_full"}"""
                  case _ =>
                    StatusCodes.InternalServerError -> """{"status":"error"}"""
                }
              case Left(err) =>
                Future.successful(StatusCodes.BadRequest -> s"""{"error":"${err.getMessage}"}""")
          }
        }
      }
    )

    Http().newServerAt("0.0.0.0", httpPort).bind(route).onComplete {
      case Success(binding) =>
        logger.info(s"🚀 Stream Processor HTTP Server listening on http://0.0.0.0:${binding.localAddress.getPort}")
      case Failure(ex) =>
        logger.error(s"Failed to bind Stream Processor HTTP server: ${ex.getMessage}")
    }
