import random
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/recommend", tags=["recommend"])


class RecommendRequest(BaseModel):
    user_id: str
    limit: int = 10
    algorithm: str = "mf"


class RecommendResponse(BaseModel):
    user_id: str
    content_ids: List[str]
    algorithm: str


@router.post("/", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    """
    Phase 1 placeholder: returns random content IDs.
    Replace with real model inference in Phase 3.
    """
    ids = [f"c-{random.randint(1, 999):03d}" for _ in range(req.limit)]
    return RecommendResponse(
        user_id=req.user_id,
        content_ids=ids,
        algorithm=req.algorithm,
    )
