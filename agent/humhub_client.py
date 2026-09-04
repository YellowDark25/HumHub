from typing import Any

import httpx

from config import humhub_url, service_secret
from errors import AgentError

SECRET_HEADER = "X-Kaizzen-Secret"


def _headers() -> dict[str, str]:
    """Monta o header do cano: segredo próprio e Bearer."""
    secret = service_secret()
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        SECRET_HEADER: secret,
        "Authorization": f"Bearer {secret}",
    }


def _service_url(path: str, query: dict[str, Any] | None = None) -> str:
    """Monta a URL nexchat do HumHub, com query opcional."""
    url = f"{humhub_url()}/nexchat/index/{path}"
    if not query:
        return url
    parts = [f"{key}={value}" for key, value in query.items()]
    return f"{url}?{'&'.join(parts)}"


async def _request(
    http: httpx.AsyncClient,
    path: str,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    query: dict[str, Any] | None = None,
) -> Any:
    """Chama uma rota nexchat autenticada pelo segredo. Falha com AgentError se o chat recusar."""
    response = await http.request(
        method,
        _service_url(path, query),
        headers=_headers(),
        json=body,
    )
    if response.status_code >= 400:
        detail = " ".join(response.text.split())[:180]
        raise AgentError(
            f"Chat retornou {response.status_code}: {detail}" if detail
            else f"Chat retornou {response.status_code}",
            response.status_code,
        )
    return response.json()


async def reply(http: httpx.AsyncClient, conversation_id: int, content: str) -> None:
    """Grava a fala da secretária na DM."""
    result = await _request(
        http,
        "secretary-reply",
        method="POST",
        body={"conversationId": conversation_id, "content": content},
    )
    if result.get("success") is False:
        raise AgentError(result.get("error") or "Não foi possível responder na conversa.", 502)


async def list_history(http: httpx.AsyncClient, conversation_id: int) -> list[dict[str, Any]]:
    """Últimas mensagens da DM, da mais antiga para a mais nova."""
    result = await _request(
        http,
        "secretary-history",
        query={"conversationId": conversation_id},
    )
    messages = []
    for item in result.get("messages") or []:
        messages.append({
            "id": int(item.get("id") or 0),
            "authorId": int(item.get("authorId") or 0),
            "content": (item.get("content") or "").strip(),
            "isSecretary": bool(item.get("isSecretary")),
            "audioFileId": item.get("audioFileId"),
        })
    return messages


async def get_google_account(http: httpx.AsyncClient, user_id: int) -> dict[str, str] | None:
    """Refresh token do Google daquele usuário, ou None se não conectou."""
    result = await _request(http, "secretary-google", query={"userId": user_id})
    account = result.get("account") or {}
    token = (account.get("refreshToken") or "").strip()
    if not token:
        return None
    return {
        "userId": str(account.get("userId") or user_id),
        "email": (account.get("email") or "").strip(),
        "refreshToken": token,
    }


async def get_audio_file(http: httpx.AsyncClient, file_id: int) -> dict[str, Any]:
    """Baixa o anexo de áudio para o STT."""
    response = await http.get(
        f"{humhub_url()}/nexchat/index/secretary-file?id={file_id}",
        headers={
            SECRET_HEADER: service_secret(),
            "Authorization": f"Bearer {service_secret()}",
        },
    )
    if response.status_code >= 400:
        raise AgentError(f"Chat retornou {response.status_code} ao baixar o áudio.", response.status_code)
    return {
        "body": response.content,
        "contentType": response.headers.get("content-type") or "application/octet-stream",
        "fileName": f"audio-{file_id}",
    }
