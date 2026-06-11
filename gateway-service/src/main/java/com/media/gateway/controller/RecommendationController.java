package com.media.gateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final WebClient.Builder webClientBuilder;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "mf") String algorithm) {

        try {
            WebClient client = webClientBuilder.baseUrl(mlServiceUrl).build();

            Map<?, ?> mlResponse = client.post()
                .uri("/recommend/")
                .bodyValue(Map.of(
                    "user_id", "anonymous",
                    "limit", limit,
                    "algorithm", algorithm
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            return ResponseEntity.ok(Map.of(
                "recommendations", mlResponse != null ? mlResponse.get("content_ids") : List.of(),
                "algorithm", algorithm,
                "source", "ml-service"
            ));
        } catch (Exception e) {
            // Fallback to random placeholder if ML service is unreachable
            List<String> ids = IntStream.range(0, limit)
                .mapToObj(i -> "c-" + String.format("%03d", (int) (Math.random() * 999)))
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "recommendations", ids,
                "algorithm", "random-fallback",
                "source", "gateway-fallback"
            ));
        }
    }
}
