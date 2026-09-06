package com.media.gateway.grpc;

import com.media.feature.FeatureEngineGrpc;
import com.media.feature.PingRequest;
import com.media.feature.PingResponse;
import com.media.feature.SimilarityMetric;
import com.media.feature.SimilarityRequest;
import com.media.feature.SimilarityResponse;
import com.media.feature.SimilarityScore;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class FeatureEngineClient {

    private final ManagedChannel channel;
    private final FeatureEngineGrpc.FeatureEngineBlockingStub blockingStub;

    public FeatureEngineClient(
            @Value("${feature.engine.host:localhost}") String host,
            @Value("${feature.engine.port:50051}") int port) {
        log.info("Connecting to C++ Feature Engine at {}:{}", host, port);
        this.channel = ManagedChannelBuilder.forAddress(host, port)
                .usePlaintext()
                .build();
        this.blockingStub = FeatureEngineGrpc.newBlockingStub(channel);
    }

    public List<SimilarityScore> computeSimilarity(String userId, List<String> contentIds, int topK) {
        try {
            SimilarityRequest request = SimilarityRequest.newBuilder()
                    .setUserId(userId)
                    .addAllContentIds(contentIds)
                    .setTopK(topK)
                    .setMetric(SimilarityMetric.COSINE)
                    .build();

            SimilarityResponse response = blockingStub
                    .withDeadlineAfter(3, TimeUnit.SECONDS)
                    .computeSimilarity(request);

            return response.getScoresList();
        } catch (Exception e) {
            log.warn("Failed to retrieve similarity from C++ Feature Engine: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public boolean ping() {
        try {
            PingResponse response = blockingStub
                    .withDeadlineAfter(2, TimeUnit.SECONDS)
                    .ping(PingRequest.getDefaultInstance());
            return "UP".equalsIgnoreCase(response.getStatus());
        } catch (Exception e) {
            log.debug("Feature Engine ping failed: {}", e.getMessage());
            return false;
        }
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
        }
    }
}
