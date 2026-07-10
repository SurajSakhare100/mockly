from fastapi import APIRouter
from pydantic import BaseModel
from app.services.llm_service import score_answer

router = APIRouter()

class ScoreRequest(BaseModel):
    question: str
    answer: str

@router.post("/answer")
async def score(req: ScoreRequest):
    result = await score_answer(req.question, req.answer)
    return result