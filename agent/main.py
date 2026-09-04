import logging
from contextlib import asynccontextmanager
from typing import Any

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from config import secretary_debounce_seconds, service_secret
from errors import AgentError
from inbox import ConversationTurnInbox
from turn import handle_secretary_turn

logging.basicConfig(level=logging.INFO)

inbox: ConversationTurnInbox | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Cria a caixa de entrada da secretária e cancela esperas no shutdown."""
    global inbox
    inbox = ConversationTurnInbox(_run_turn_safe, secretary_debounce_seconds())
    logging.info(
        "Caixa da secretária pronta: debounce=%.1fs (um turno por conversa)",
        secretary_debounce_seconds(),
    )
    try:
        yield
    finally:
        await inbox.aclose()
        inbox = None


app = FastAPI(title="NexHub Secretária", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, bool]:
    """Diz se o processo do agente está no ar."""
    return {"ok": True}


@app.post("/api/secretary/turn")
async def secretary_turn(request: Request) -> JSONResponse:
    """Recebe o recado do HumHub, agrupa na conversa e devolve 202 sem esperar a resposta."""
    _require_service_secret(request)
    payload = await _read_turn_input(request)
    if inbox is None:
        raise AgentError("Agente da secretária ainda não está pronto.", 503)
    await inbox.enqueue(payload)
    return JSONResponse({"ok": True}, status_code=202)


def _require_service_secret(request: Request) -> None:
    """Compara X-Kaizzen-Secret ou Bearer com KAIZZEN_SERVICE_SECRET."""
    expected = service_secret()
    given = (request.headers.get("x-kaizzen-secret") or "").strip()
    if not given:
        authorization = (request.headers.get("authorization") or "").strip()
        if authorization.lower().startswith("bearer "):
            given = authorization[7:].strip()
    if not given or not expected or given != expected:
        raise AgentError("Serviço da secretária não autorizado.", 401)


async def _read_turn_input(request: Request) -> dict[str, Any]:
    """Lê conversationId, messageId, userId, content e audioFileId do corpo."""
    body = await request.json()
    audio = body.get("audioFileId")
    return {
        "conversationId": int(body.get("conversationId") or 0),
        "messageId": int(body.get("messageId") or 0),
        "userId": int(body.get("userId") or 0),
        "content": body.get("content") if isinstance(body.get("content"), str) else "",
        "audioFileId": int(audio) if audio else None,
    }


async def _run_turn_safe(payload: dict[str, Any]) -> None:
    """Roda o turno e registra falha no log, sem derrubar o processo."""
    logging.info(
        "Turno da secretária iniciado: conversationId=%s messageId=%s userId=%s",
        payload["conversationId"],
        payload["messageId"],
        payload["userId"],
    )
    try:
        async with httpx.AsyncClient(timeout=60.0) as http:
            await handle_secretary_turn(http, payload)
        logging.info("Turno da secretária concluído: conversationId=%s", payload["conversationId"])
    except Exception as error:
        logging.exception("Turno da secretária falhou: %s", error)


@app.exception_handler(AgentError)
async def agent_error_handler(_request: Request, error: AgentError) -> JSONResponse:
    """Devolve o status e a mensagem do AgentError em JSON."""
    return JSONResponse({"error": str(error)}, status_code=error.status)
