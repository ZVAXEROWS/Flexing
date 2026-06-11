cmake_minimum_required(VERSION 3.25)
project(FeatureEngine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# --- Dependencies ---
find_package(gRPC CONFIG REQUIRED)
find_package(Protobuf CONFIG REQUIRED)
find_package(Eigen3 CONFIG REQUIRED)

# --- Protobuf / gRPC code generation ---
set(PROTO_FILES proto/feature_engine.proto)

add_library(feature_engine_proto ${PROTO_FILES})
target_link_libraries(feature_engine_proto
  PUBLIC protobuf::libprotobuf gRPC::grpc++
)
protobuf_generate(TARGET feature_engine_proto LANGUAGE cpp)

# gRPC plugin generation (add when cmake-grpc integration is confirmed)
# grpc_generate(TARGET feature_engine_proto LANGUAGE cpp)

# --- Server binary ---
add_executable(feature_engine_server
  src/main.cpp
  src/FeatureEngineServiceImpl.cpp
  src/SimilarityComputer.cpp
)

target_link_libraries(feature_engine_server
  PRIVATE
    feature_engine_proto
    Eigen3::Eigen
    gRPC::grpc++_reflection
)

target_include_directories(feature_engine_server
  PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# --- Tests ---
enable_testing()
# TODO: add GTest targets in Phase 3
