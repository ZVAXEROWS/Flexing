#include "FeatureEngineServiceImpl.hpp"
#include <chrono>

grpc::Status FeatureEngineServiceImpl::ComputeSimilarity(
    grpc::ServerContext* /*context*/,
    const media::feature::SimilarityRequest* request,
    media::feature::SimilarityResponse* response)
{
    response->set_user_id(request->user_id());
    response->set_computed_at_ms(
        std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count()
    );

    std::vector<std::string> contentIds(request->content_ids().begin(), request->content_ids().end());
    MetricType metric = MetricType::COSINE;

    if (request->metric() == media::feature::SimilarityMetric::DOT_PRODUCT) {
        metric = MetricType::DOT_PRODUCT;
    } else if (request->metric() == media::feature::SimilarityMetric::EUCLIDEAN) {
        metric = MetricType::EUCLIDEAN;
    }

    auto scores = SimilarityComputer::computeSimilarity(
        request->user_id(),
        contentIds,
        metric,
        request->top_k()
    );

    for (const auto& [contentId, score] : scores) {
        auto* item = response->add_scores();
        item->set_content_id(contentId);
        item->set_score(score);
    }

    return grpc::Status::OK;
}

grpc::Status FeatureEngineServiceImpl::BatchUpdate(
    grpc::ServerContext* /*context*/,
    const media::feature::BatchUpdateRequest* request,
    media::feature::BatchUpdateResponse* response)
{
    int processed = 0;
    int failed = 0;

    for (const auto& event : request->events()) {
        try {
            float weight = event.weight() > 0.0f ? event.weight() : 1.0f;
            SimilarityComputer::ingestEvent(event.user_id(), event.content_id(), weight);
            ++processed;
        } catch (...) {
            ++failed;
            response->add_errors("Failed to ingest event for user: " + event.user_id());
        }
    }

    response->set_processed_count(processed);
    response->set_failed_count(failed);
    return grpc::Status::OK;
}

grpc::Status FeatureEngineServiceImpl::GetFeatureVector(
    grpc::ServerContext* /*context*/,
    const media::feature::FeatureVectorRequest* request,
    media::feature::FeatureVectorResponse* response)
{
    int dims = request->dimensions() > 0 ? request->dimensions() : 64;
    auto vec = SimilarityComputer::getFeatureVector(request->content_id(), dims);

    response->set_content_id(request->content_id());
    response->set_dimensions(dims);
    for (float v : vec) {
        response->add_vector(v);
    }

    return grpc::Status::OK;
}

grpc::Status FeatureEngineServiceImpl::StreamSimilarities(
    grpc::ServerContext* /*context*/,
    grpc::ServerReaderWriter<media::feature::SimilarityResponse, media::feature::SimilarityRequest>* stream)
{
    media::feature::SimilarityRequest req;
    while (stream->Read(&req)) {
        media::feature::SimilarityResponse resp;
        resp.set_user_id(req.user_id());
        resp.set_computed_at_ms(
            std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()
            ).count()
        );

        std::vector<std::string> contentIds(req.content_ids().begin(), req.content_ids().end());
        auto scores = SimilarityComputer::computeCosine(req.user_id(), contentIds, req.top_k());

        for (const auto& [contentId, score] : scores) {
            auto* item = resp.add_scores();
            item->set_content_id(contentId);
            item->set_score(score);
        }

        stream->Write(resp);
    }
    return grpc::Status::OK;
}

grpc::Status FeatureEngineServiceImpl::Ping(
    grpc::ServerContext* /*context*/,
    const media::feature::PingRequest* /*request*/,
    media::feature::PingResponse* response)
{
    response->set_status("UP");
    response->set_version("0.1.0-cpp20");
    return grpc::Status::OK;
}
