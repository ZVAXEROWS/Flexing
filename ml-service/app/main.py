from fastapi import FastAPI
from app.routers import recommend

app = FastAPI(
    title="ML Recommendation Service",
    version="0.1.0",
    description="Serves KNN, Matrix Factorisation, and Neural CF recommendation models.",
)

app.include_router(recommend.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "version": "0.1.0"}
