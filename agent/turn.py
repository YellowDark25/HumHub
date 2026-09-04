import json
import logging
from typing import Any

import httpx

import anthropic_llm
import google_workspace
import humhub_client
import speech
from errors import AgentError
from tools import SECRETARY_NOT_CONNECTED, SECRETARY_SYSTEM_PROMPT, secretary_tool_definitions

MAX_TOOL_ROUNDS = 6


async def handle_secretary_turn(http: httpx.AsyncClient, payload: dict[str, Any]) -> None:
    """Processa um recado da DM da secretária e responde na mesma conversa."""
    conversation_id = int(payload.get("conversationId") or 0)
    user_id = int(payload.get("userId") or 0)
    if not conversation_id or not user_id:
        raise AgentError("Turno da secretária inválido.", 400)

    try:
        await _run_secretary_turn(http, payload)
    except Exception as error:
        reason = str(error) if isinstance(error, AgentError) else "Tente de novo em instantes."
        try:
            await humhub_client.reply(http, conversation_id, f"Não consegui concluir agora. {reason}")
        except Exception as reply_error:
            logging.error("Não foi possível avisar o usuário no chat: %s", reply_error)
        raise


async def _run_secretary_turn(http: httpx.AsyncClient, payload: dict[str, Any]) -> None:
    """Corpo do turno: texto, Google, modelo e resposta."""
    conversation_id = int(payload["conversationId"])
    spoken = await _resolve_user_text(http, payload)
    if not spoken:
        await humhub_client.reply(
            http,
            conversation_id,
            "Não entendi o recado. Pode repetir em texto ou gravar de novo?",
        )
        return

    account = await humhub_client.get_google_account(http, int(payload["userId"]))
    if not account:
        await humhub_client.reply(http, conversation_id, SECRETARY_NOT_CONNECTED)
        return

    if not anthropic_llm.is_configured():
        await humhub_client.reply(http, conversation_id, f"Recebi: {spoken}")
        return

    history = await humhub_client.list_history(http, conversation_id)
    messages = [
        {"role": "assistant" if item["isSecretary"] else "user", "content": item["content"]}
        for item in history
        if item["content"]
    ]
    if not any(item["role"] == "user" and item["content"] == spoken for item in messages):
        messages.append({"role": "user", "content": spoken})

    tools = secretary_tool_definitions()
    reply = ""
    for _ in range(MAX_TOOL_ROUNDS):
        completion = await anthropic_llm.complete(http, SECRETARY_SYSTEM_PROMPT, messages, tools)
        if not completion["toolCalls"]:
            reply = completion["text"].strip()
            break
        tool_lines = [
            await _run_secretary_tool(http, account["refreshToken"], call)
            for call in completion["toolCalls"]
        ]
        messages.append({
            "role": "assistant",
            "content": completion["text"] or "(usei as ferramentas da agenda)",
        })
        messages.append({
            "role": "user",
            "content": "Resultado das ferramentas:\n" + "\n".join(tool_lines),
        })
        reply = completion["text"].strip()

    await humhub_client.reply(
        http,
        conversation_id,
        reply or "Pronto. Se quiser, peço outro ajuste na agenda ou nas tarefas.",
    )


async def _resolve_user_text(http: httpx.AsyncClient, payload: dict[str, Any]) -> str:
    """Monta o texto do usuário: conteúdo da mensagem ou transcrição do anexo."""
    written = str(payload.get("content") or "").strip()
    if written:
        return written
    audio_file_id = payload.get("audioFileId")
    if not audio_file_id or not speech.is_configured():
        return ""
    file = await humhub_client.get_audio_file(http, int(audio_file_id))
    return (await speech.transcribe(http, file)).strip()


async def _run_secretary_tool(http: httpx.AsyncClient, refresh_token: str, call: dict[str, Any]) -> str:
    """Executa uma tool do Google e devolve um resumo em texto para o modelo."""
    name = call.get("name") or ""
    arguments = call.get("arguments") or {}
    try:
        result = await _dispatch_tool(http, refresh_token, name, arguments)
        return json.dumps(result, ensure_ascii=False)
    except Exception as error:
        message = str(error) if isinstance(error, Exception) else "falha na ferramenta"
        return f"Erro em {name}: {message}"


async def _dispatch_tool(
    http: httpx.AsyncClient,
    refresh_token: str,
    name: str,
    arguments: dict[str, Any],
) -> Any:
    """Encaminha o nome da tool para a função do Google correspondente."""
    if name == "list_events":
        return await google_workspace.list_events(
            http, refresh_token, str(arguments.get("timeMin") or ""), str(arguments.get("timeMax") or ""),
        )
    if name == "create_event":
        return await google_workspace.create_event(
            http,
            refresh_token,
            str(arguments.get("title") or ""),
            str(arguments.get("start") or ""),
            str(arguments.get("end") or ""),
            _optional_string(arguments.get("description")),
        )
    if name == "update_event":
        return await google_workspace.update_event(
            http,
            refresh_token,
            str(arguments.get("eventId") or ""),
            _optional_string(arguments.get("title")),
            _optional_string(arguments.get("start")),
            _optional_string(arguments.get("end")),
            _optional_string(arguments.get("description")),
        )
    if name == "list_tasks":
        return await google_workspace.list_tasks(http, refresh_token)
    if name == "create_task":
        return await google_workspace.create_task(
            http,
            refresh_token,
            str(arguments.get("title") or ""),
            _optional_string(arguments.get("notes")),
            _optional_string(arguments.get("due")),
        )
    if name == "complete_task":
        return await google_workspace.complete_task(http, refresh_token, str(arguments.get("taskId") or ""))
    return f"Ferramenta desconhecida: {name}"


def _optional_string(value: Any) -> str | None:
    """Devolve string não vazia, ou None quando o modelo não mandou o campo."""
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    return trimmed or None
