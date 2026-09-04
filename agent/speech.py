import base64
from typing import Any

import httpx

from config import gemini_api_key, openai_api_key
from errors import AgentError


def is_configured() -> bool:
    """Diz se há Gemini ou OpenAI para transcrever."""
    return bool(gemini_api_key() or openai_api_key())


async def transcribe(http: httpx.AsyncClient, file: dict[str, Any]) -> str:
    """Transcreve o anexo. Prefere Gemini Flash; senão Whisper."""
    if gemini_api_key():
        return await _transcribe_gemini(http, file)
    return await _transcribe_whisper(http, file)


async def _transcribe_gemini(http: httpx.AsyncClient, file: dict[str, Any]) -> str:
    """Envia o áudio em inlineData para o Gemini e devolve só o texto falado."""
    mime = file.get("contentType") or "audio/webm"
    encoded = base64.b64encode(file["body"]).decode("ascii")
    response = await http.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key()}",
        json={
            "contents": [{
                "parts": [
                    {"text": "Transcreva o áudio em português do Brasil. Devolva só o texto falado."},
                    {"inlineData": {"mimeType": mime, "data": encoded}},
                ],
            }],
        },
    )
    data = response.json()
    if response.status_code >= 400:
        error = data.get("error") or {}
        raise AgentError(error.get("message") or "Não foi possível transcrever o áudio.", 502)
    parts = (((data.get("candidates") or [{}])[0].get("content") or {}).get("parts") or [])
    return "".join(part.get("text") or "" for part in parts).strip()


async def _transcribe_whisper(http: httpx.AsyncClient, file: dict[str, Any]) -> str:
    """Envia o anexo ao Whisper e devolve a transcrição em português."""
    name = file.get("fileName") or "audio.webm"
    mime = file.get("contentType") or "audio/webm"
    response = await http.post(
        "https://api.openai.com/v1/audio/transcriptions",
        headers={"Authorization": f"Bearer {openai_api_key()}"},
        files={"file": (name, file["body"], mime)},
        data={"model": "whisper-1", "language": "pt"},
    )
    data = response.json()
    if response.status_code >= 400:
        error = data.get("error") or {}
        raise AgentError(error.get("message") or "Não foi possível transcrever o áudio.", 502)
    return (data.get("text") or "").strip()
