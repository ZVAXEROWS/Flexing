package com.media.gateway.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractionEventDto {
    private String eventType;
    private String contentId;
    private Integer duration;
    private Float weight;
    private String timestamp;
    private Map<String, Object> metadata;
}
