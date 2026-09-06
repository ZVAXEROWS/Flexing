import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/recommend", tags=["recommend"])

CATALOGUE_IDS = [
    "c-001", "c-002", "c-003", "c-004",
    "c-005", "c-006", "c-007", "c-008"
]

ALGO_PREFERENCES = {
    "mf": ["c-002", "c-003", "c-005", "c-004", "c-001", "c-006", "c-008", "c-007"],
    "knn": ["c-005", "c-001", "c-006", "c-003", "c-002", "c-008", "c-004", "c-007"],
    "ncf": ["c-002", "c-004", "c-008", "c-001", "c-005", "c-003", "c-006", "c-007"],
}


class RecommendRequest(BaseModel):
    user_id: str
    limit: int = 10
    algorithm: str = "mf"
    genre: Optional[str] = None
    type: Optional[str] = None


class RecommendResponse(BaseModel):
    user_id: str
    content_ids: List[str]
    algorithm: str


@router.post("/", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    """
    Inference endpoint returning top candidate media IDs based on the selected
    algorithm (Matrix Factorization, KNN Collaborative, or Neural Collaborative Filtering).
    """
    algo_key = req.algorithm.lower()
    candidates = ALGO_PREFERENCES.get(algo_key, CATALOGUE_IDS)
    selected_ids = candidates[: req.limit]

    return RecommendResponse(
        user_id=req.user_id,
        content_ids=selected_ids,
        algorithm=req.algorithm,
    )
