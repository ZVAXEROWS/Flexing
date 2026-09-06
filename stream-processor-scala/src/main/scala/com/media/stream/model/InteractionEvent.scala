package com.media.stream.model

import io.circe.generic.semiauto.*
import io.circe.{Decoder, Encoder}

case class InteractionEvent(
  eventId:     String,
  userId:      String,
  contentId:   String,
  eventType:   String,
  weight:      Float,
  timestampMs: Long,
  duration:    Option[Int] = None
)

object InteractionEvent:
  given Encoder[InteractionEvent] = deriveEncoder
  given Decoder[InteractionEvent] = deriveDecoder
