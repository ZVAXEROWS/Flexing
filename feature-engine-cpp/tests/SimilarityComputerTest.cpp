#include "../src/SimilarityComputer.hpp"
#include <iostream>
#include <cassert>
#include <cmath>

void testColdStart() {
    SimilarityComputer::clear();
    std::vector<std::string> candidates = {"c-001", "c-002", "c-003"};
    auto scores = SimilarityComputer::computeCosine("user-cold-start", candidates);

    assert(scores.size() == 3);
    for (const auto& [cid, score] : scores) {
        assert(std::abs(score - (1.0f / 3.0f)) < 0.001f);
    }
    std::cout << "✅ testColdStart passed.\n";
}

void testIngestionAndCosineRanking() {
    SimilarityComputer::clear();

    // User A rates sci-fi movies highly
    SimilarityComputer::ingestEvent("user-alice", "c-interstellar", 5.0f);
    SimilarityComputer::ingestEvent("user-alice", "c-arrival", 4.5f);

    // User B also loves interstellar and blade runner
    SimilarityComputer::ingestEvent("user-bob", "c-interstellar", 5.0f);
    SimilarityComputer::ingestEvent("user-bob", "c-bladerunner", 4.8f);

    // Score candidates for user-bob
    std::vector<std::string> candidates = {"c-arrival", "c-romance-123"};
    auto scores = SimilarityComputer::computeCosine("user-bob", candidates, 2);

    assert(scores.size() == 2);
    // arrival should rank above random romance movie because of alice's co-rating of interstellar
    assert(scores[0].first == "c-arrival");
    assert(scores[0].second > scores[1].second);

    std::cout << "✅ testIngestionAndCosineRanking passed.\n";
}

void testFeatureVectorGeneration() {
    auto vec1 = SimilarityComputer::getFeatureVector("c-001", 64);
    auto vec2 = SimilarityComputer::getFeatureVector("c-001", 64);
    auto vec3 = SimilarityComputer::getFeatureVector("c-002", 64);

    assert(vec1.size() == 64);
    assert(vec2.size() == 64);
    assert(vec3.size() == 64);

    // Check deterministic property
    for (size_t i = 0; i < 64; ++i) {
        assert(vec1[i] == vec2[i]);
    }

    // Check L2 unit norm
    float normSq = 0.0f;
    for (float v : vec1) normSq += v * v;
    assert(std::abs(std::sqrt(normSq) - 1.0f) < 0.01f);

    std::cout << "✅ testFeatureVectorGeneration passed.\n";
}

int main() {
    std::cout << "Running SimilarityComputer Unit Tests...\n";
    testColdStart();
    testIngestionAndCosineRanking();
    testFeatureVectorGeneration();
    std::cout << "🎉 All SimilarityComputer tests PASSED successfully!\n";
    return 0;
}
