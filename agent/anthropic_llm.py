import logging
from typing import Any

import httpx

from config import anthropic_api_key
from errors import AgentError

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-haiku-4-5"


def is_configured() -> bool:
    """Diz se ANTHROPIC_API_KEY está presente."""
    return bool(anthropic_api_key())


async def complete(
    http: httpx.AsyncClient,
    system: str,
    messages: list[dict[str, str]],
    tools: list[dict[str, Any]],
) -> dict[str, Any]:
    """Uma rodada no Claude: texto e/ou tool_use. Sem chave o turno não deve chegar aqui."""
    response = await http.post(
        ANTHROPIC_URL,
        headers={
            "Content-Type": "application/json",
            "x-api-key": anthropic_api_key(),
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": MODEL,
            "max_tokens": 1024,
            "system": system,
            "messages": messages,
            "tools": tools,
        },
    )
    data = response.json()
    if response.status_code >= 400:
        error = data.get("error") or {}
        detail = (error.get("message") or "").strip() or "O Claude não respondeu."
        logging.error("Anthropic recusou o turno: status=%s model=%s detail=%s", response.status_code, MODEL, detail)
        raise AgentError(f"{detail} (modelo {MODEL})", 502)

    text: list[str] = []
    tool_calls: list[dict[str, Any]] = []
    for block in data.get("content") or []:
        if block.get("type") == "text" and block.get("text"):
            text.append(block["text"])
        if block.get("type") == "tool_use" and block.get("name") and block.get("id"):
            tool_calls.append({
                "id": block["id"],
                "name": block["name"],
                "arguments": block.get("input") or {},
            })
    return {"text": "\n".join(text).strip(), "toolCalls": tool_calls}
