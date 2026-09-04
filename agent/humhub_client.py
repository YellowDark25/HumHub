import logging
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


async def list_history(
    http: httpx.AsyncClient,
    conversation_id: int,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    """Últimas mensagens da DM, da mais antiga para a mais nova."""
    query: dict[str, Any] = {"conversationId": conversation_id}
    if limit is not None:
        query["limit"] = limit
    result = await _request(
        http,
        "secretary-history",
        query=query,
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


def _empty_conversation_state(conversation_id: int) -> dict[str, Any]:
    """Estado vazio usado quando o HumHub ainda não expõe o resumo."""
    return {
        "conversationId": conversation_id,
        "summary": "",
        "summarizedUpToMessageId": 0,
        "turnCount": 0,
    }


async def get_conversation_state(http: httpx.AsyncClient, conversation_id: int) -> dict[str, Any]:
    """Lê o resumo rolante e o cursor da conversa. Sem a rota nova, segue sem resumo."""
    try:
        result = await _request(http, "secretary-state", query={"conversationId": conversation_id})
    except AgentError as error:
        if error.status == 404:
            logging.warning("Chat ainda não tem secretary-state; turno segue sem resumo.")
            return _empty_conversation_state(conversation_id)
        raise
    state = result.get("state") or {}
    return {
        "conversationId": int(state.get("conversationId") or conversation_id),
        "summary": (state.get("summary") or "").strip(),
        "summarizedUpToMessageId": int(state.get("summarizedUpToMessageId") or 0),
        "turnCount": int(state.get("turnCount") or 0),
    }


async def save_conversation_state(
    http: httpx.AsyncClient,
    conversation_id: int,
    summary: str,
    summarized_up_to_message_id: int,
    turn_count: int,
) -> None:
    """Grava o resumo rolante depois do turno. Sem a rota nova, só registra o aviso."""
    try:
        result = await _request(
            http,
            "secretary-state",
            method="POST",
            body={
                "conversationId": conversation_id,
                "summary": summary,
                "summarizedUpToMessageId": summarized_up_to_message_id,
                "turnCount": turn_count,
            },
        )
    except AgentError as error:
        if error.status == 404:
            logging.warning("Chat ainda não tem secretary-state; resumo não foi gravado.")
            return
        raise
    if result.get("success") is False:
        raise AgentError(result.get("error") or "Não foi possível gravar o resumo da conversa.", 502)


async def list_memory(http: httpx.AsyncClient, user_id: int) -> list[dict[str, str]]:
    """Preferências estruturadas do usuário. Sem a rota nova, devolve lista vazia."""
    try:
        result = await _request(http, "secretary-memory", query={"userId": user_id})
    except AgentError as error:
        if error.status == 404:
            logging.warning("Chat ainda não tem secretary-memory; turno segue sem preferências.")
            return []
        raise
    items: list[dict[str, str]] = []
    for item in result.get("items") or []:
        key = (item.get("key") or "").strip()
        value = (item.get("value") or "").strip()
        if key and value:
            items.append({"key": key, "value": value})
    return items


async def remember_memory(http: httpx.AsyncClient, user_id: int, key: str, value: str) -> dict[str, str]:
    """Cria ou atualiza uma preferência do usuário."""
    result = await _request(
        http,
        "secretary-memory",
        method="POST",
        body={"userId": user_id, "key": key, "value": value},
    )
    if result.get("success") is False:
        raise AgentError(result.get("error") or "Não foi possível gravar a preferência.", 502)
    item = result.get("item") or {}
    return {
        "key": (item.get("key") or key).strip(),
        "value": (item.get("value") or value).strip(),
    }


async def forget_memory(http: httpx.AsyncClient, user_id: int, key: str) -> bool:
    """Apaga uma preferência. False se a chave não existia."""
    result = await _request(
        http,
        "secretary-memory",
        method="DELETE",
        body={"userId": user_id, "key": key},
        query={"userId": user_id, "key": key},
    )
    if result.get("success") is False:
        raise AgentError(result.get("error") or "Não foi possível esquecer a preferência.", 502)
    return bool(result.get("forgotten"))
