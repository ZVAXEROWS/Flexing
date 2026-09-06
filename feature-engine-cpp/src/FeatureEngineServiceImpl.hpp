#pragma once

#include <grpcpp/grpcpp.h>
#include "proto/feature_engine.grpc.pb.h"
#include "SimilarityComputer.hpp"

class FeatureEngineServiceImpl final : public media::feature::FeatureEngine::Service {
public:
    grpc::Status ComputeSimilarity(
        grpc::ServerContext* context,
        const media::feature::SimilarityRequest* request,
        media::feature::SimilarityResponse* response) override;

    grpc::Status BatchUpdate(
        grpc::ServerContext* context,
        const media::feature::BatchUpdateRequest* request,
        media::feature::BatchUpdateResponse* response) override;

    grpc::Status GetFeatureVector(
        grpc::ServerContext* context,
        const media::feature::FeatureVectorRequest* request,
        media::feature::FeatureVectorResponse* response) override;

    grpc::Status StreamSimilarities(
        grpc::ServerContext* context,
        grpc::ServerReaderWriter<media::feature::SimilarityResponse, media::feature::SimilarityRequest>* stream) override;

    grpc::Status Ping(
        grpc::ServerContext* context,
        const media::feature::PingRequest* request,
        media::feature::PingResponse* response) override;
};
