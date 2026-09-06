package com.media.gateway.controller;

import com.media.gateway.model.InteractionEventDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/events")
public class EventsController {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired(required = false)
    public EventsController(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> ingestEvent(
            @RequestBody InteractionEventDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        String eventId = "evt-" + UUID.randomUUID().toString();
        String userId = userDetails != null ? userDetails.getUsername() : "anonymous";
        float weight = calculateWeight(dto.getEventType(), dto.getWeight());

        Map<String, Object> eventPayload = Map.of(
                "eventId", eventId,
                "userId", userId,
                "contentId", dto.getContentId() != null ? dto.getContentId() : "c-unknown",
                "eventType", dto.getEventType() != null ? dto.getEventType() : "view",
                "weight", weight,
                "timestampMs", Instant.now().toEpochMilli(),
                "duration", dto.getDuration() != null ? dto.getDuration() : 0
        );

        if (kafkaTemplate != null) {
            try {
                kafkaTemplate.send("user-events", userId, eventPayload);
                log.debug("Published event [{}] for user [{}] to Kafka 'user-events'", eventId, userId);
            } catch (Exception e) {
                log.warn("Kafka publish failed (falling back to direct async logging): {}", e.getMessage());
            }
        } else {
            log.info("KafkaTemplate unavailable — direct event capture: {}", eventPayload);
        }

        return ResponseEntity.accepted().body(Map.of(
                "eventId", eventId,
                "status", "queued"
        ));
    }

    private float calculateWeight(String eventType, Float customWeight) {
        if (customWeight != null && customWeight > 0.0f) {
            return customWeight;
        }
        if (eventType == null) return 1.0f;
        return switch (eventType.toLowerCase()) {
            case "rate" -> 5.0f;
            case "complete" -> 3.0f;
            case "click" -> 1.5f;
            case "skip" -> 0.1f;
            case "view" -> 1.0f;
            default -> 1.0f;
        };
    }
}
