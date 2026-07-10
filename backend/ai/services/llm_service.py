from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

async def generate_question(role: str, history: list) -> str:
    context = "\n".join([f"Q: {h['question']} A: {h['answer']}" for h in history])
    prompt = f"You are interviewing a candidate for a {role} role. History:\n{context}\nAsk the next relevant interview question only."

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content

async def score_answer(question: str, answer: str) -> dict:
    prompt = f"Question: {question}\nAnswer: {answer}\nScore this answer 0-10 and give 1-line feedback. Reply as JSON: {{\"score\": int, \"feedback\": str}}"

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    import json
    return json.loads(response.choices[0].message.content)