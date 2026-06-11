#pragma once
#include <string>
#include <vector>
#include <utility>

/**
 * SimilarityComputer
 *
 * Manages an in-memory user-item interaction matrix and computes
 * cosine similarity scores between a user profile and a set of content items.
 *
 * Thread-safe via internal mutex. Replace the in-memory store with a persistent
 * vector database (e.g., Milvus, Qdrant) for production use.
 */
class SimilarityComputer {
public:
    /**
     * Ingest a single user-item interaction (increments the weight cell).
     */
    static void ingestEvent(const std::string& userId,
                            const std::string& contentId,
                            float weight);

    /**
     * Compute cosine similarity between the user's interaction profile and
     * each of the supplied content items.
     *
     * @param userId     Target user ID
     * @param contentIds List of candidate content IDs to score
     * @param topK       Return only the top-K results (0 = return all)
     * @return           Pairs of (contentId, score), sorted descending by score
     */
    static std::vector<std::pair<std::string, float>>
    computeCosine(const std::string& userId,
                  const std::vector<std::string>& contentIds,
                  int topK = 0);
};
