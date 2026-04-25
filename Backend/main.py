import os
import json
import logging
import sqlite3
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from groq import Groq

# --- KEEP YOUR FRIEND'S ORIGINAL ROUTER IMPORTS ---
from speech_to_text import router as stt_router
from chat import router as chat_router
from auth_routes import router as auth_router, init_users_db
from incident_routes import router as incident_router, init_incidents_db
from chautara_db import DB_PATH as CHAUTARA_SQLITE_PATH, init_chautara_sanctuary_db

# Load environment variables
load_dotenv()
init_users_db()
init_incidents_db()
init_chautara_sanctuary_db()

from chautara_api import router as chautara_router

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _cors_allow_origins() -> list[str]:
    """Browsers reject Access-Control-Allow-Origin: * when credentials are used; list real origins."""
    defaults = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    out: list[str] = []
    extra = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if extra:
        out.extend(x.strip() for x in extra.split(",") if x.strip())
    fe = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    if fe:
        out.append(fe)
    for d in defaults:
        if d not in out:
            out.append(d)
    seen: set[str] = set()
    unique: list[str] = []
    for o in out:
        if o not in seen:
            seen.add(o)
            unique.append(o)
    return unique


def _cors_origin_regex() -> str | None:
    """
    When you open the app via Vite's Network URL (e.g. http://10.x.x.x:8080 from a phone),
    the browser sends that origin — it is not the same as http://localhost:8080.
    Set CORS_ALLOW_LAN=1 in Backend/.env for local dev on private networks.
    """
    if os.getenv("CORS_ALLOW_LAN", "").lower() not in ("1", "true", "yes"):
        return None
    # loopback + RFC1918 private ranges, any port (matches Vite :8080, :5173, etc.)
    return (
        r"^https?://("
        r"localhost|127\.0\.0\.1|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
        r")(:\d+)?$"
    )


# FastAPI app
app = FastAPI(
    title="AAFNAI Main API",
    version="1.0.0",
)

# --- CORS ---
# allow_private_network: Chrome sends a PNA preflight when the page (e.g. localhost:8080)
# targets a "local" address (e.g. 127.0.0.1:5000). Without this, preflight returns 400 and login fails.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins(),
    allow_origin_regex=_cors_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)

# --- MODELS ---
class Pebble(BaseModel):
    content: str = Field(..., max_length=120)
    district: str = "Anonymous"
    stage_month: int = 1


class InteractionRequest(BaseModel):
    content: str
    type: str


# --- GROQ ---
_groq_client = None


def _get_groq_client() -> Groq:
    global _groq_client
    key = os.environ.get("VITE_GROQ_API_KEY") or os.environ.get("GROQ_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="Missing GROQ_API_KEY")
    if _groq_client is None:
        _groq_client = Groq(api_key=key)
    return _groq_client


# --- ROUTES ---
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/chautara/interact")
async def handle_interaction(request: InteractionRequest):

    if request.type == "comment":
        prompt = f"""
Analyze this support message: "{request.content}"

If it is negative, hateful, or judgmental -> respond 'REJECT'.
If it is supportive, kind, or empathetic -> respond 'PASS'.

Respond ONLY with one word.
"""

        completion = _get_groq_client().chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile"
        )

        if "REJECT" in completion.choices[0].message.content.upper():
            raise HTTPException(
                status_code=400,
                detail="Only supportive messages allowed"
            )

    return {"status": "Positive energy shared"}


@app.post("/api/diyas")
async def light_diya():
    did = os.urandom(3).hex()
    exp = time.time() + 86400
    conn = sqlite3.connect(CHAUTARA_SQLITE_PATH)
    try:
        conn.execute(
            "INSERT INTO sanctuary_diyas (id, expires_at) VALUES (?, ?)",
            (did, exp),
        )
        conn.commit()
    finally:
        conn.close()
    return {"status": "Diya lit"}


# ===== AI LEGAL ASSISTANT =====

from rag import load_pdfs, build_db, handle_query

try:
    load_pdfs()
    build_db()
except Exception:
    pass

with open("local_data.json") as f:
    local_data = json.load(f)


class ChatRequest(BaseModel):
    query: str


def search_local(query):
    for key in local_data:
        if key in query.lower():
            return local_data[key]
    return "I'm here to help you with legal rights."


@app.post("/api/legal-chat")
async def legal_chat(req: ChatRequest):
    query = req.query

    try:
        result = handle_query(query)

        if result["sources"]:
            context = result["answer"]

            prompt = f"""
You are a Nepal Legal AI Assistant.

STRICT RULES:
- Always mention ACT name
- Mention SECTION number if available
- Give step-by-step actions
- If crime involved -> explain FIR process
- If user asks -> generate FIR format

Context:
{context}

User Query:
{query}
"""

            response = _get_groq_client().chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
            )

            return {
                "reply": response.choices[0].message.content,
                "sources": result["sources"]
            }

        else:
            return {
                "reply": result["answer"],
                "sources": [],
                "offline": True
            }

    except Exception:
        return {
            "reply": search_local(query),
            "offline": True
        }


# --- ROUTERS ---
app.include_router(auth_router, prefix="/api/auth")
app.include_router(incident_router, prefix="/api")
app.include_router(stt_router, prefix="/stt")
app.include_router(chat_router, prefix="/chat")
app.include_router(chautara_router, prefix="/api/chautara")


# --- RUN ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)