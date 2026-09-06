cmake_minimum_required(VERSION 3.25)
project(FeatureEngine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# --- Find Protobuf & gRPC ---
find_package(Protobuf REQUIRED)
find_package(gRPC CONFIG QUIET)

# Check if pkg-config fallback is needed for gRPC
if(NOT gRPC_FOUND)
  find_package(PkgConfig REQUIRED)
  pkg_check_modules(GRPC REQUIRED grpc++)
  pkg_check_modules(GRPC_REFLECTION grpc++_reflection)
endif()

# --- Protobuf / gRPC code generation ---
set(PROTO_SRC_DIR "${CMAKE_CURRENT_SOURCE_DIR}/proto")
set(PROTO_FILE "${PROTO_SRC_DIR}/feature_engine.proto")

find_program(GRPC_CPP_PLUGIN_EXECUTABLE grpc_cpp_plugin)

if(GRPC_CPP_PLUGIN_EXECUTABLE)
  add_custom_command(
    OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/proto/feature_engine.pb.cc"
           "${CMAKE_CURRENT_BINARY_DIR}/proto/feature_engine.pb.h"
           "${CMAKE_CURRENT_BINARY_DIR}/proto/feature_engine.grpc.pb.cc"
           "${CMAKE_CURRENT_BINARY_DIR}/proto/feature_engine.grpc.pb.h"
    COMMAND ${PROTOBUF_PROTOC_EXECUTABLE}
    ARGS --cpp_out="${CMAKE_CURRENT_BINARY_DIR}/proto"
         --grpc_out="${CMAKE_CURRENT_BINARY_DIR}/proto"
         --plugin=protoc-gen-grpc="${GRPC_CPP_PLUGIN_EXECUTABLE}"
         -I "${PROTO_SRC_DIR}"
         "${PROTO_FILE}"
    DEPENDS "${PROTO_FILE}"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
  )
endif()

# --- Unit Test Target (Pure C++ / Zero external proto dependency) ---
add_executable(similarity_test
  tests/SimilarityComputerTest.cpp
  src/SimilarityComputer.cpp
)
target_include_directories(similarity_test PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src)

# --- Main Server Binary (if gRPC is available) ---
if(TARGET gRPC::grpc++ OR GRPC_FOUND)
  file(MAKE_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/proto")
  
  if(EXISTS "${CMAKE_CURRENT_BINARY_DIR}/proto/feature_engine.grpc.pb.cc")
    add_executable(feature_engine_server
      src/main.cpp
      src/FeatureEngineServiceImpl.cpp
      src/SimilarityComputer.cpp
      "${CMAKE_CURRENT_BINARY_DIR}/proto/feature_engine.pb.cc"
      "${CMAKE_CURRENT_BINARY_DIR}/proto/feature_engine.grpc.pb.cc"
    )
    target_include_directories(feature_engine_server PRIVATE
      ${CMAKE_CURRENT_SOURCE_DIR}/src
      ${CMAKE_CURRENT_BINARY_DIR}
    )
    if(TARGET gRPC::grpc++)
      target_link_libraries(feature_engine_server PRIVATE
        protobuf::libprotobuf
        gRPC::grpc++
        gRPC::grpc++_reflection
      )
    else()
      target_link_libraries(feature_engine_server PRIVATE
        ${Protobuf_LIBRARIES}
        ${GRPC_LIBRARIES}
        ${GRPC_REFLECTION_LIBRARIES}
      )
      target_include_directories(feature_engine_server PRIVATE
        ${Protobuf_INCLUDE_DIRS}
        ${GRPC_INCLUDE_DIRS}
      )
    endif()
  endif()
endif()

enable_testing()
add_test(NAME SimilarityComputerTest COMMAND similarity_test)
