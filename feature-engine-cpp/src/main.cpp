#include <grpcpp/grpcpp.h>
#include <grpcpp/ext/proto_server_reflection_plugin.h>
#include "FeatureEngineServiceImpl.hpp"
#include <iostream>
#include <memory>
#include <csignal>

static std::unique_ptr<grpc::Server> g_server;

void handleSignal(int signal) {
    std::cout << "\nReceived signal " << signal << ", shutting down Feature Engine server gracefully...\n";
    if (g_server) {
        g_server->Shutdown();
    }
}

int main(int argc, char** argv) {
    std::signal(SIGINT, handleSignal);
    std::signal(SIGTERM, handleSignal);

    std::string serverAddress("0.0.0.0:50051");
    if (argc > 1) {
        serverAddress = argv[1];
    }

    FeatureEngineServiceImpl service;

    grpc::reflection::InitProtoReflectionServerBuilderPlugin();
    grpc::ServerBuilder builder;
    builder.AddListeningPort(serverAddress, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    g_server = builder.BuildAndStart();
    std::cout << "========================================\n";
    std::cout << "🚀 C++ Feature Engine gRPC Server Started\n";
    std::cout << "📡 Listening on: " << serverAddress << "\n";
    std::cout << "⚙️  Services: FeatureEngine (Cosine, Dot, Euclidean)\n";
    std::cout << "========================================\n";

    g_server->Wait();
    std::cout << "Feature Engine server stopped.\n";
    return 0;
}
