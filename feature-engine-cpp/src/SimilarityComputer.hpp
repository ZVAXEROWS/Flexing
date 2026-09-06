#pragma once

#include <string>
#include <vector>
#include <utility>
#include <unordered_map>
#include <mutex>
#include <cmath>
#include <algorithm>

enum class MetricType {
    COSINE = 0,
    DOT_PRODUCT = 1,
    EUCLIDEAN = 2
};

/**
 * SimilarityComputer
 *
 * High-performance, thread-safe interaction matrix and vector similarity engine.
 * Computes Cosine, Dot Product, and Euclidean metrics between user interaction profiles
 * and candidate media items.
 */
class SimilarityComputer {
public:
    /**
     * Ingest a single user-content interaction event with a decay/weight score.
     */
    static void ingestEvent(const std::string& userId,
                            const std::string& contentId,
                            float weight);

    /**
     * Compute cosine similarity between the user profile and candidate items.
     */
    static std::vector<std::pair<std::string, float>>
    computeCosine(const std::string& userId,
                  const std::vector<std::string>& contentIds,
                  int topK = 0);

    /**
     * Compute dot product similarity.
     */
    static std::vector<std::pair<std::string, float>>
    computeDotProduct(const std::string& userId,
                      const std::vector<std::string>& contentIds,
                      int topK = 0);

    /**
     * Compute Euclidean-distance-based similarity (1.0 / (1.0 + distance)).
     */
    static std::vector<std::pair<std::string, float>>
    computeEuclidean(const std::string& userId,
                     const std::vector<std::string>& contentIds,
                     int topK = 0);

    /**
     * Generic similarity dispatcher based on MetricType enum.
     */
    static std::vector<std::pair<std::string, float>>
    computeSimilarity(const std::string& userId,
                      const std::vector<std::string>& contentIds,
                      MetricType metric,
                      int topK = 0);

    /**
     * Generate or fetch dense pseudo-embedding feature vector for an item.
     */
    static std::vector<float>
    getFeatureVector(const std::string& contentId, int dimensions);

    /**
     * Reset internal matrices (primarily used for unit testing).
     */
    static void clear();
};
