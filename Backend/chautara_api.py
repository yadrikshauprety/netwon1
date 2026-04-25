"""
Peer Connect (Chautara) — feed, post, comment, RAG reflections.

Mounted on the main app at prefix /api/chautara (see main.py).
Run everything with: uvicorn main:app --reload --host 127.0.0.1 --port 5000
"""
import os
import sqlite3
import time
import random
import asyncio
import re
import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util

from chautara_db import DB_PATH, init_chautara_sanctuary_db, seed_chautara_stories_if_empty

# ---------- INIT ----------
load_dotenv()

router = APIRouter(tags=["chautara"])

_groq_client = None


def _get_groq() -> Groq | None:
    global _groq_client
    key = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")
    if not key:
        return None
    if _groq_client is None:
        _groq_client = Groq(api_key=key)
    return _groq_client


embedder = SentenceTransformer('all-MiniLM-L6-v2')


# ---------- STARTUP ----------
init_chautara_sanctuary_db()
seed_chautara_stories_if_empty()


# ---------- MODELS ----------
class PostReq(BaseModel):
    content: str


class CommentReq(BaseModel):
    story_id: str
    content: str


# ---------- FILTER ----------
def normalize(text):
    return re.sub(r"[^a-z0-9\u0900-\u097F\s]", "", text.lower())


def contains_hate(text):
    banned = ["pagal", "idiot", "marja", "drugs"]
    clean = normalize(text)
    return any(word in clean for word in banned)


def classify(text):
    groq = _get_groq()
    if not groq:
        return "NEGATIVE"

    try:
        res = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": "Return POSITIVE or NEGATIVE"},
                {"role": "user", "content": text},
            ],
            model="llama-3.3-70b-versatile",
        )
        return res.choices[0].message.content.strip().upper()
    except Exception:
        return "NEGATIVE"


# ---------- RAG ----------
def get_similar_context(user_text):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT content FROM stories")
    stories = [row[0] for row in cursor.fetchall()]
    conn.close()

    if not stories:
        return ""

    corpus = embedder.encode(stories, convert_to_tensor=True)
    query = embedder.encode(user_text, convert_to_tensor=True)

    hits = util.semantic_search(query, corpus, top_k=5)
    similar = [stories[h["corpus_id"]] for h in hits[0]]
    similar = list(dict.fromkeys(similar))[:3]

    return "\n".join(similar)


async def generate_rag_reflections(user_text, story_id):
    context = get_similar_context(user_text)

    prompt = f"""
USER STORY:
"{user_text}"

SIMILAR EXPERIENCES:
{context}

Write 3 realistic replies based on these experiences.

Rules:
- No generic lines
- Mention feelings/situation
- 1–2 sentences each
- Return JSON list

Example:
["reply1", "reply2", "reply3"]
"""

    groq = _get_groq()
    if not groq:
        return

    try:
        completion = groq.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
        )

        output = completion.choices[0].message.content
        print("🧠 RAW:", output)

        try:
            parts = json.loads(output)
        except Exception:
            parts = []

        if len(parts) != 3:
            parts = [
                f"I went through something similar to '{user_text}', it was overwhelming.",
                "I remember feeling emotionally drained in that situation too.",
                "It took time, but I slowly found ways to cope.",
            ]

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        for content in parts:
            cursor.execute(
                "INSERT INTO comments VALUES (?, ?, ?, ?)",
                (os.urandom(3).hex(), story_id, content, f"Sister #{random.randint(100, 999)}"),
            )

        conn.commit()
        conn.close()

    except Exception as e:
        print("❌ RAG ERROR:", e)


# ---------- ROUTES (paths relative to include_router prefix) ----------
@router.get("/feed")
async def get_feed():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM stories ORDER BY timestamp DESC")
        stories = [dict(row) for row in cursor.fetchall()]

        for s in stories:
            cursor.execute(
                "SELECT content, author FROM comments WHERE story_id=?",
                (s["id"],),
            )
            s["replies"] = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return stories

    except Exception as e:
        print("❌ FEED ERROR:", e)
        return []


@router.post("/post")
async def post_story(req: PostReq):
    try:
        sid = os.urandom(4).hex()

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO stories (id, content, author, diyas, timestamp, type)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (sid, req.content, "Anonymous Sister", 0, time.time(), "pebble"),
        )

        conn.commit()
        conn.close()

        asyncio.create_task(generate_rag_reflections(req.content, sid))

        return {"id": sid}

    except Exception as e:
        print("❌ POST ERROR:", e)
        raise HTTPException(500, "Failed to post")


@router.post("/comment")
async def add_comment(req: CommentReq):
    if not req.content.strip():
        raise HTTPException(400, "Empty")

    if contains_hate(req.content):
        raise HTTPException(400, "Blocked")

    if classify(req.content) != "POSITIVE":
        raise HTTPException(400, "Only supportive")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO comments VALUES (?, ?, ?, ?)",
        (os.urandom(3).hex(), req.story_id, req.content, "Sister (Peer)"),
    )

    conn.commit()
    conn.close()

    return {"ok": True}


# Optional: run Peer Connect alone on port 5001 (same routes as main app)
if __name__ == "__main__":
    import uvicorn
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    _app = FastAPI(title="Chautara (standalone)")
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    _app.include_router(router, prefix="/api/chautara")
    port = int(os.environ.get("PORT", "5001"))
    uvicorn.run(_app, host="127.0.0.1", port=port)
