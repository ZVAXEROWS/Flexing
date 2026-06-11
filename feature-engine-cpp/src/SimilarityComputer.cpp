// TODO (Phase 3): Implement SimilarityComputer.
// See docs/phases/03-cpp-engine.md for the full implementation.

#include "SimilarityComputer.hpp"
#include <cmath>
#include <mutex>
#include <unordered_map>
#include <algorithm>

static std::unordered_map<std::string,
    std::unordered_map<std::string, float>> g_matrix;
static std::mutex g_mutex;

void SimilarityComputer::ingestEvent(
    const std::string& userId,
    const std::string& contentId,
    float weight)
{
    std::lock_guard<std::mutex> lock(g_mutex);
    g_matrix[userId][contentId] += weight;
}

std::vector<std::pair<std::string, float>>
SimilarityComputer::computeCosine(
    const std::string& userId,
    const std::vector<std::string>& contentIds,
    int topK)
{
    std::lock_guard<std::mutex> lock(g_mutex);

    std::vector<std::pair<std::string, float>> scores;
    scores.reserve(contentIds.size());

    for (const auto& cid : contentIds) {
        // Placeholder: uniform score until Phase 3 implementation
        scores.emplace_back(cid, 1.0f / static_cast<float>(contentIds.size() + 1));
    }

    std::sort(scores.begin(), scores.end(),
        [](const auto& a, const auto& b){ return a.second > b.second; });

    if (topK > 0 && static_cast<int>(scores.size()) > topK)
        scores.resize(topK);

    return scores;
}
