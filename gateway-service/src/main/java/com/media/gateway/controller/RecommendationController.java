package com.media.gateway.controller;

import com.media.feature.SimilarityScore;
import com.media.gateway.grpc.FeatureEngineClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final WebClient.Builder webClientBuilder;
    private final FeatureEngineClient featureEngineClient;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "mf") String algorithm,
            @RequestParam(defaultValue = "user-default") String userId) {

        try {
            WebClient client = webClientBuilder.baseUrl(mlServiceUrl).build();

            Map<?, ?> mlResponse = client.post()
                .uri("/recommend/")
                .bodyValue(Map.of(
                    "user_id", userId,
                    "limit", limit,
                    "algorithm", algorithm
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            List<?> contentIds = mlResponse != null ? (List<?>) mlResponse.get("content_ids") : List.of();
            List<String> candidateIds = contentIds.stream().map(Object::toString).collect(Collectors.toList());

            // Augment with C++ Feature Engine vector similarity scoring
            List<SimilarityScore> similarityScores = featureEngineClient.computeSimilarity(userId, candidateIds, limit);

            List<Map<String, Object>> rankedRecommendations = similarityScores.stream()
                .map(score -> Map.<String, Object>of(
                    "content_id", score.getContentId(),
                    "score", score.getScore(),
                    "reason", "Vector similarity score from C++ Feature Engine"
                ))
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "userId", userId,
                "algorithm", algorithm,
                "recommendations", rankedRecommendations.isEmpty() ? candidateIds : rankedRecommendations,
                "source", "ml-service+cpp-feature-engine"
            ));
        } catch (Exception e) {
            log.warn("ML service call failed ({}), falling back to direct C++ Feature Engine scoring", e.getMessage());

            // Direct fallback to C++ Feature Engine
            List<String> defaultCandidates = IntStream.range(1, 10)
                .mapToObj(i -> "c-00" + i)
                .collect(Collectors.toList());

            List<SimilarityScore> scores = featureEngineClient.computeSimilarity(userId, defaultCandidates, limit);

            if (!scores.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "userId", userId,
                    "algorithm", "cpp-feature-engine-direct",
                    "recommendations", scores.stream()
                        .map(s -> Map.of("content_id", s.getContentId(), "score", s.getScore()))
                        .collect(Collectors.toList()),
                    "source", "feature-engine-grpc"
                ));
            }

            // Ultimate fallback
            List<String> ids = IntStream.range(0, limit)
                .mapToObj(i -> "c-" + String.format("%03d", (int) (Math.random() * 999)))
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "userId", userId,
                "recommendations", ids,
                "algorithm", "random-fallback",
                "source", "gateway-fallback"
            ));
        }
    }
}
