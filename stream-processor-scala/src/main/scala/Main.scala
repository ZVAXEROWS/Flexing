package com.media.stream

import org.apache.pekko.actor.typed.ActorSystem
import org.apache.pekko.actor.typed.scaladsl.Behaviors

/**
 * Stream Processor entry point (Phase 4 placeholder).
 *
 * See docs/phases/04-scala-streaming.md for the full implementation.
 */
object Main extends App:
  given system: ActorSystem[Nothing] =
    ActorSystem(Behaviors.empty, "stream-processor")

  system.log.info("Stream Processor placeholder started — implement in Phase 4")
