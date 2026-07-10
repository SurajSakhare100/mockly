from fastapi import FastAPI
from app.api.routes import generate, score

app = FastAPI(title="Mockly - AI Service")

app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(score.router, prefix="/api/score", tags=["score"])

@app.get("/health")
def health():
    return {"status": "ok"}