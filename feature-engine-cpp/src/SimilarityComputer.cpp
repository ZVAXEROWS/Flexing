#include "SimilarityComputer.hpp"
#include <cmath>
#include <mutex>
#include <unordered_map>
#include <algorithm>
#include <functional>

// Global sparse matrices protected by mutex
// user_id -> (content_id -> aggregate weight)
static std::unordered_map<std::string, std::unordered_map<std::string, float>> g_userMatrix;
// content_id -> (user_id -> aggregate weight)
static std::unordered_map<std::string, std::unordered_map<std::string, float>> g_itemMatrix;

static std::mutex g_matrixMutex;

void SimilarityComputer::ingestEvent(
    const std::string& userId,
    const std::string& contentId,
    float weight)
{
    std::lock_guard<std::mutex> lock(g_matrixMutex);
    g_userMatrix[userId][contentId] += weight;
    g_itemMatrix[contentId][userId] += weight;
}

std::vector<std::pair<std::string, float>>
SimilarityComputer::computeCosine(
    const std::string& userId,
    const std::vector<std::string>& contentIds,
    int topK)
{
    std::lock_guard<std::mutex> lock(g_matrixMutex);

    std::vector<std::pair<std::string, float>> scores;
    scores.reserve(contentIds.size());

    auto userIt = g_userMatrix.find(userId);
    if (userIt == g_userMatrix.end() || userIt->second.empty()) {
        // Cold-start fallback: return uniform normalized score
        float uniformScore = contentIds.empty() ? 0.0f : (1.0f / static_cast<float>(contentIds.size()));
        for (const auto& cid : contentIds) {
            scores.emplace_back(cid, uniformScore);
        }
        return scores;
    }

    const auto& userInteractions = userIt->second;

    // Calculate user profile norm
    float userNormSq = 0.0f;
    for (const auto& [cid, w] : userInteractions) {
        userNormSq += w * w;
    }
    float userNorm = std::sqrt(userNormSq);

    for (const auto& cid : contentIds) {
        auto itemIt = g_itemMatrix.find(cid);
        if (itemIt == g_itemMatrix.end() || itemIt->second.empty()) {
            scores.emplace_back(cid, 0.05f); // baseline minimum for candidate item
            continue;
        }

        const auto& itemUsers = itemIt->second;
        float dotProduct = 0.0f;
        float itemNormSq = 0.0f;

        // Calculate item norm across all interacting users
        for (const auto& [uid, w] : itemUsers) {
            itemNormSq += w * w;
            auto uMatch = userInteractions.find(cid); // direct interaction bonus
            if (uMatch != userInteractions.end()) {
                dotProduct += uMatch->second * w;
            }
        }

        // Collaborative co-occurrence overlap
        for (const auto& [userInteractedCid, userWeight] : userInteractions) {
            auto otherItemIt = g_itemMatrix.find(userInteractedCid);
            if (otherItemIt != g_itemMatrix.end()) {
                for (const auto& [coUser, coWeight] : otherItemIt->second) {
                    auto match = itemUsers.find(coUser);
                    if (match != itemUsers.end()) {
                        dotProduct += userWeight * (match->second * 0.5f);
                    }
                }
            }
        }

        float itemNorm = std::sqrt(itemNormSq);
        float score = 0.0f;
        if (userNorm > 0.0f && itemNorm > 0.0f) {
            score = std::clamp(dotProduct / (userNorm * itemNorm), 0.0f, 1.0f);
        }

        // If score is negligible, assign a small positive non-zero floor based on item popularity
        if (score <= 0.001f) {
            score = std::clamp(static_cast<float>(itemUsers.size()) * 0.05f, 0.05f, 0.5f);
        }

        scores.emplace_back(cid, score);
    }

    // Sort descending by score
    std::sort(scores.begin(), scores.end(), [](const auto& a, const auto& b) {
        return a.second > b.second;
    });

    if (topK > 0 && static_cast<int>(scores.size()) > topK) {
        scores.resize(topK);
    }

    return scores;
}

std::vector<std::pair<std::string, float>>
SimilarityComputer::computeDotProduct(
    const std::string& userId,
    const std::vector<std::string>& contentIds,
    int topK)
{
    std::lock_guard<std::mutex> lock(g_matrixMutex);
    std::vector<std::pair<std::string, float>> scores;

    auto userIt = g_userMatrix.find(userId);
    const auto& userInteractions = (userIt != g_userMatrix.end()) ? userIt->second : std::unordered_map<std::string, float>{};

    for (const auto& cid : contentIds) {
        float dot = 0.0f;
        auto direct = userInteractions.find(cid);
        if (direct != userInteractions.end()) {
            dot += direct->second;
        }
        auto itemIt = g_itemMatrix.find(cid);
        if (itemIt != g_itemMatrix.end()) {
            dot += itemIt->second.size() * 0.2f;
        }
        scores.emplace_back(cid, dot);
    }

    std::sort(scores.begin(), scores.end(), [](const auto& a, const auto& b) {
        return a.second > b.second;
    });

    if (topK > 0 && static_cast<int>(scores.size()) > topK) {
        scores.resize(topK);
    }

    return scores;
}

std::vector<std::pair<std::string, float>>
SimilarityComputer::computeEuclidean(
    const std::string& userId,
    const std::vector<std::string>& contentIds,
    int topK)
{
    std::lock_guard<std::mutex> lock(g_matrixMutex);
    std::vector<std::pair<std::string, float>> scores;

    auto userIt = g_userMatrix.find(userId);
    const auto& userInteractions = (userIt != g_userMatrix.end()) ? userIt->second : std::unordered_map<std::string, float>{};

    for (const auto& cid : contentIds) {
        float diffSq = 0.0f;
        auto direct = userInteractions.find(cid);
        float userVal = (direct != userInteractions.end()) ? direct->second : 0.0f;

        auto itemIt = g_itemMatrix.find(cid);
        float itemVal = (itemIt != g_itemMatrix.end()) ? static_cast<float>(itemIt->second.size()) : 0.0f;

        diffSq = (userVal - itemVal) * (userVal - itemVal);
        float distance = std::sqrt(diffSq);
        float similarity = 1.0f / (1.0f + distance);

        scores.emplace_back(cid, similarity);
    }

    std::sort(scores.begin(), scores.end(), [](const auto& a, const auto& b) {
        return a.second > b.second;
    });

    if (topK > 0 && static_cast<int>(scores.size()) > topK) {
        scores.resize(topK);
    }

    return scores;
}

std::vector<std::pair<std::string, float>>
SimilarityComputer::computeSimilarity(
    const std::string& userId,
    const std::vector<std::string>& contentIds,
    MetricType metric,
    int topK)
{
    switch (metric) {
        case MetricType::DOT_PRODUCT:
            return computeDotProduct(userId, contentIds, topK);
        case MetricType::EUCLIDEAN:
            return computeEuclidean(userId, contentIds, topK);
        case MetricType::COSINE:
        default:
            return computeCosine(userId, contentIds, topK);
    }
}

std::vector<float>
SimilarityComputer::getFeatureVector(const std::string& contentId, int dimensions)
{
    std::vector<float> vector(dimensions, 0.0f);
    size_t seed = std::hash<std::string>{}(contentId);

    float norm = 0.0f;
    for (int i = 0; i < dimensions; ++i) {
        // Deterministic pseudo-random generation per contentId
        seed = seed * 1664525u + 1013904223u;
        float val = static_cast<float>(seed % 1000) / 1000.0f;
        vector[i] = val;
        norm += val * val;
    }

    // L2 Normalize
    norm = std::sqrt(norm);
    if (norm > 0.0f) {
        for (int i = 0; i < dimensions; ++i) {
            vector[i] /= norm;
        }
    }

    return vector;
}

void SimilarityComputer::clear()
{
    std::lock_guard<std::mutex> lock(g_matrixMutex);
    g_userMatrix.clear();
    g_itemMatrix.clear();
}
