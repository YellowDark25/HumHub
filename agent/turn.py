import json
import logging
from typing import Any

import httpx

import anthropic_llm
import google_workspace
import humhub_client
import memory
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
    """Corpo do turno: texto, memória, modelo, resposta e resumo rolante."""
    conversation_id = int(payload["conversationId"])
    user_id = int(payload["userId"])
    spoken = await _resolve_user_text(http, payload)
    account = await humhub_client.get_google_account(http, user_id)
    if not account:
        await humhub_client.reply(http, conversation_id, SECRETARY_NOT_CONNECTED)
        return

    state, preferences, history = await _load_prompt_context(http, conversation_id, user_id)
    if not spoken and not _trailing_user_contents(history):
        await humhub_client.reply(
            http,
            conversation_id,
            "Não entendi o recado. Pode repetir em texto ou gravar de novo?",
        )
        return

    if not anthropic_llm.is_configured():
        echo = spoken or "\n".join(_trailing_user_contents(history))
        await humhub_client.reply(http, conversation_id, f"Recebi: {echo}")
        return

    system = memory.build_system_prompt(SECRETARY_SYSTEM_PROMPT, state["summary"], preferences)
    messages = _history_to_messages(history, spoken)
    reply = await _collect_model_reply(http, system, messages, account["refreshToken"], user_id)
    await humhub_client.reply(http, conversation_id, reply)
    await _refresh_memory_after_turn(http, conversation_id)


async def _load_prompt_context(
    http: httpx.AsyncClient,
    conversation_id: int,
    user_id: int,
) -> tuple[dict[str, Any], list[dict[str, str]], list[dict[str, Any]]]:
    """Lê resumo, preferências e as últimas falas cruas que entram no prompt."""
    state = await humhub_client.get_conversation_state(http, conversation_id)
    preferences = await humhub_client.list_memory(http, user_id)
    history = await humhub_client.list_history(
        http,
        conversation_id,
        memory.prompt_history_limit(),
    )
    return state, preferences, history


def _history_to_messages(history: list[dict[str, Any]], spoken: str) -> list[dict[str, str]]:
    """Converte o histórico em mensagens do modelo e garante o recado atual."""
    messages = [
        {"role": "assistant" if item["isSecretary"] else "user", "content": item["content"]}
        for item in history
        if item["content"]
    ]
    if spoken and not any(item["role"] == "user" and item["content"] == spoken for item in messages):
        messages.append({"role": "user", "content": spoken})
    return messages


def _trailing_user_contents(history: list[dict[str, Any]]) -> list[str]:
    """Textos do usuário depois da última fala da secretária — os pedaços desta fala."""
    texts: list[str] = []
    for item in reversed(history):
        if item["isSecretary"]:
            break
        if item["content"]:
            texts.append(item["content"])
    texts.reverse()
    return texts


async def _collect_model_reply(
    http: httpx.AsyncClient,
    system: str,
    messages: list[dict[str, str]],
    refresh_token: str,
    user_id: int,
) -> str:
    """Roda o loop de tools e só aceita como resposta o texto de uma rodada sem tool calls."""
    tools = secretary_tool_definitions()
    for _ in range(MAX_TOOL_ROUNDS):
        completion = await anthropic_llm.complete(http, system, messages, tools)
        if not completion["toolCalls"]:
            return memory.pick_final_reply(completion["text"])
        tool_lines = [
            await _run_secretary_tool(http, refresh_token, user_id, call)
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
    return memory.pick_final_reply("")


async def _refresh_memory_after_turn(http: httpx.AsyncClient, conversation_id: int) -> None:
    """Atualiza o resumo depois da resposta; falha aqui não desfaz o recado já enviado."""
    try:
        await memory.refresh_after_turn(http, conversation_id)
    except Exception as error:
        logging.error("Não atualizei o resumo da conversa: %s", error)


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


async def _run_secretary_tool(
    http: httpx.AsyncClient,
    refresh_token: str,
    user_id: int,
    call: dict[str, Any],
) -> str:
    """Executa uma tool (Google ou memória) e devolve um resumo em texto para o modelo."""
    name = call.get("name") or ""
    arguments = call.get("arguments") or {}
    try:
        result = await _dispatch_tool(http, refresh_token, user_id, name, arguments)
        logging.info("Tool da secretária ok: %s", name)
        return json.dumps(result, ensure_ascii=False)
    except Exception as error:
        message = str(error) if isinstance(error, Exception) else "falha na ferramenta"
        return f"Erro em {name}: {message}"


async def _dispatch_tool(
    http: httpx.AsyncClient,
    refresh_token: str,
    user_id: int,
    name: str,
    arguments: dict[str, Any],
) -> Any:
    """Encaminha o nome da tool para a função do Google ou da memória."""
    if name == "lembrar_preferencia":
        return await humhub_client.remember_memory(
            http,
            user_id,
            str(arguments.get("chave") or ""),
            str(arguments.get("valor") or ""),
        )
    if name == "esquecer_preferencia":
        forgotten = await humhub_client.forget_memory(http, user_id, str(arguments.get("chave") or ""))
        return {"key": str(arguments.get("chave") or ""), "forgotten": forgotten}
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
        return await google_workspace.complete_task(
            http,
            refresh_token,
            _optional_string(arguments.get("taskId")),
            _optional_string(arguments.get("title")),
            _optional_string(arguments.get("listId")),
        )
    return f"Ferramenta desconhecida: {name}"


def _optional_string(value: Any) -> str | None:
    """Devolve string não vazia, ou None quando o modelo não mandou o campo."""
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    return trimmed or None
