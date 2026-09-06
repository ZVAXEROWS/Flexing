package com.media.stream

import org.apache.pekko.actor.typed.ActorSystem
import org.apache.pekko.actor.typed.scaladsl.Behaviors
import org.slf4j.LoggerFactory

/**
 * Scala Stream Processor Application Entrypoint
 */
object Main extends App:
  private val logger = LoggerFactory.getLogger(getClass)

  given system: ActorSystem[Nothing] =
    ActorSystem(Behaviors.empty, "stream-processor-system")

  val kafkaBrokers = sys.env.getOrElse("KAFKA_BROKERS", "localhost:9092")
  val featureEngineHost = sys.env.getOrElse("FEATURE_ENGINE_HOST", "localhost")
  val featureEnginePort = sys.env.getOrElse("FEATURE_ENGINE_PORT", "50051").toInt
  val httpPort = sys.env.getOrElse("STREAM_PROCESSOR_PORT", "8090").toInt

  logger.info("==================================================")
  logger.info("🎬 Smart Media Recommender - Scala Stream Processor")
  logger.info(s"📡 Kafka Brokers: $kafkaBrokers")
  logger.info(s"⚡ C++ Feature Engine: $featureEngineHost:$featureEnginePort")
  logger.info(s"🌐 HTTP Ingest Port: $httpPort")
  logger.info("==================================================")

  val processor = StreamProcessor(kafkaBrokers, featureEngineHost, featureEnginePort, httpPort)
  processor.start()
