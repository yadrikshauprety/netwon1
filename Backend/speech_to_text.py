import os
import httpx
from fastapi import APIRouter, File, UploadFile, HTTPException, Header
from pydantic import BaseModel
from typing import Annotated
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SUPPORTED_MODES = ["transcribe", "translate", "verbatim", "translit", "codemix"]
SUPPORTED_FORMATS = ["wav", "mp3", "aac", "ogg", "opus", "flac", "m4a", "webm"]

class TranscriptionResponse(BaseModel):
    transcript: str
    language_code: str
    model: str
    mode: str
    raw_response: dict

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    api_key: Annotated[str, Header(alias="X-Sarvam-API-Key")] = None,
    language_code: str = "ne-IN",
    mode: str = "transcribe",
    model: str = "saaras:v3",
):
    """
    Transcribe Nepali audio using Sarvam AI.
    """
    api_key_to_use = api_key or os.getenv("SARVAM_API_KEY")
    if not api_key_to_use:
        raise HTTPException(
            status_code=401,
            detail="Missing Sarvam API key. Pass it via the X-Sarvam-API-Key header or set SARVAM_API_KEY in .env",
        )

    if mode not in SUPPORTED_MODES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode '{mode}'. Choose from: {SUPPORTED_MODES}",
        )

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    filename = file.filename or "audio.wav"
    content_type = file.content_type or "audio/wav"

    logger.info(f"Transcribing file: {filename} | lang: {language_code} | mode: {mode} | model: {model}")

    form_data = {
        "model": (None, model),
        "language_code": (None, language_code),
    }
    if model == "saaras:v3":
        form_data["mode"] = (None, mode)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                SARVAM_STT_URL,
                headers={"api-subscription-key": api_key_to_use},
                data={k: v[1] for k, v in form_data.items()},
                files={"file": (filename, audio_bytes, content_type)},
            )

        if response.status_code != 200:
            logger.error(f"Sarvam API error {response.status_code}: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Sarvam API error: {response.text}",
            )

        result = response.json()
        logger.info(f"Transcription result: {result}")

        transcript = result.get("transcript", "")

        return TranscriptionResponse(
            transcript=transcript,
            language_code=language_code,
            model=model,
            mode=mode,
            raw_response=result,
        )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to Sarvam API timed out.")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Network error reaching Sarvam API: {str(e)}")

@router.post("/transcribe-and-translate")
async def transcribe_and_translate(
    file: UploadFile = File(...),
    api_key: Annotated[str, Header(alias="X-Sarvam-API-Key")] = None,
    language_code: str = "ne-IN",
):
    """
    Transcribe Nepali speech AND translate it to English in one shot.
    Uses saaras:v3 with mode=translate.
    """
    api_key_to_use = api_key or os.getenv("SARVAM_API_KEY")
    if not api_key_to_use:
        raise HTTPException(status_code=401, detail="Missing Sarvam API key.")

    audio_bytes = await file.read()
    filename = file.filename or "audio.wav"
    content_type = file.content_type or "audio/wav"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                SARVAM_STT_URL,
                headers={"api-subscription-key": api_key_to_use},
                data={"model": "saaras:v3", "language_code": language_code, "mode": "translate"},
                files={"file": (filename, audio_bytes, content_type)},
            )

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return response.json()

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout reaching Sarvam API.")
