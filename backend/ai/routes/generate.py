from fastapi import APIRouter
from pydantic import BaseModel
from app.services.llm_service import generate_question

router = APIRouter()

class GenerateRequest(BaseModel):
    role: str
    history: list = []

@router.post("/question")
async def generate(req: GenerateRequest):
    question = await generate_question(req.role, req.history)
    return {"question": question}