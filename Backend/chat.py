import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    system_prompt: str

@router.post("/")
async def chat_completion(request: ChatRequest):
    groq_api_key = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured in backend .env file.")
        
    # Build payload
    messages = [{"role": "system", "content": request.system_prompt}]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": messages,
                    "temperature": 0.7
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Groq API Error {response.status_code}: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Error from Groq API")
                
            return response.json()
            
    except Exception as e:
        logger.error(f"Failed to communicate with Groq: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with Groq API")
