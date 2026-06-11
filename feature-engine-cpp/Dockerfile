# Phase 1 stub — replaced in Phase 3 with a real C++ build
# Runs a minimal HTTP server that returns 503 for all gRPC calls
FROM python:3.11-slim
WORKDIR /app

RUN pip install --no-cache-dir grpcio grpcio-tools

# Simple placeholder that listens on 50051 and exits cleanly
CMD ["python3", "-c", "import time; print('Feature Engine stub running — implement in Phase 3'); time.sleep(86400)"]

EXPOSE 50051
