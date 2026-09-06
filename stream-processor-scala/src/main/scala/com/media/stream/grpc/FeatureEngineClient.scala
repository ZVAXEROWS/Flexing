package com.media.stream.grpc

import io.grpc.{ManagedChannel, ManagedChannelBuilder}
import media.feature.feature_engine.{
  FeatureEngineGrpc, BatchUpdateRequest, BatchUpdateResponse, InteractionEvent as ProtoEvent, EventType
}
import com.media.stream.model.InteractionEvent
import scala.concurrent.{Future, ExecutionContext}
import org.slf4j.LoggerFactory

class FeatureEngineClient(host: String, port: Int)(using ec: ExecutionContext):
  private val logger = LoggerFactory.getLogger(getClass)

  private val channel: ManagedChannel = ManagedChannelBuilder
    .forAddress(host, port)
    .usePlaintext()
    .build()

  private val stub = FeatureEngineGrpc.stub(channel)

  def batchUpdate(events: List[InteractionEvent]): Future[BatchUpdateResponse] =
    if (events.isEmpty) {
      Future.successful(BatchUpdateResponse(processedCount = 0, failedCount = 0))
    } else {
      val protoEvents = events.map { e =>
        ProtoEvent(
          userId      = e.userId,
          contentId   = e.contentId,
          `type`      = mapEventType(e.eventType),
          weight      = if (e.weight > 0) e.weight else 1.0f,
          timestampMs = e.timestampMs
        )
      }
      val request = BatchUpdateRequest(events = protoEvents)
      stub.batchUpdate(request).recover { case ex: Throwable =>
        logger.warn(s"Failed to send batch update to Feature Engine at $host:$port: ${ex.getMessage}")
        BatchUpdateResponse(processedCount = 0, failedCount = events.size, errors = Seq(ex.getMessage))
      }
    }

  private def mapEventType(s: String): EventType =
    s.toLowerCase match
      case "view"     => EventType.VIEW
      case "click"    => EventType.CLICK
      case "rate"     => EventType.RATE
      case "complete" => EventType.COMPLETE
      case "skip"     => EventType.SKIP
      case _          => EventType.VIEW

  def shutdown(): Unit =
    if (!channel.isShutdown) {
      channel.shutdown()
    }
