import json
import logging
import re
from typing import Any

import httpx

import anthropic_llm
import clock
import google_workspace
import humhub_client
import memory
import speech
from errors import AgentError
from tools import SECRETARY_NOT_CONNECTED, SECRETARY_SYSTEM_PROMPT, secretary_tool_definitions

MAX_TOOL_ROUNDS = 6
# Pedido concreto de escrita na agenda (verbo + horário). Só isso dispara o nudge.
AGENDA_WRITE_MARKERS = (
    "marcar",
    "marca ",
    "agendar",
    "agende",
    "coloque",
    "coloca",
    "colocar",
    "cria ",
    "crie ",
    "criar ",
    "adiciona",
    "remarcar",
    "remarca",
)
# Pergunta sobre o que a secretária faz — conversa, não ação na agenda.
CAPABILITY_MARKERS = (
    "o que você",
    "o que vc",
    "o que mais",
    "pode fazer",
    "podendo",
    "você faz",
    "vc faz",
    "suas funções",
    "suas capacidades",
    "o que consegue",
)
# Horário falado. "as 5 tarefas" não entra: "as" sem acento só vale com h, :mm ou fim de frase.
AGENDA_TIME_HINT = re.compile(
    r"""
    (?:
        \d{1,2}:\d{2}
        | \d{1,2}h
        | às\s+\d{1,2}(?::\d{2})?h?
        | as\s+\d{1,2}(?::\d{2}|h|(?=\s*(?:horas?\b|$|[.,;!?])))
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)
# Recado interno. Se for só papo, o modelo deve ignorar e não repetir isto no chat.
TOOL_NUDGE = (
    "Recado interno, não mostre isto ao usuário. "
    "Se o último recado pedia criar, alterar ou listar um item concreto da agenda "
    "(título e horário), chame a tool agora. "
    "Se era só conversa ou pergunta sobre o que você faz, ignore este recado e responda à pessoa. "
    "Nunca fale em tool, turno ou aviso interno."
)


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

    session = google_workspace.GoogleSession(account["refreshToken"]) if account else None
    time_zone = await _calendar_time_zone(http, session)
    system = memory.build_system_prompt(
        SECRETARY_SYSTEM_PROMPT,
        state["summary"],
        preferences,
        time_zone=time_zone,
    )
    messages = _history_to_messages(history, spoken)
    reply = await _collect_model_reply(http, system, messages, session, user_id)
    await humhub_client.reply(http, conversation_id, reply)
    await _refresh_memory_after_turn(http, conversation_id)


async def _calendar_time_zone(
    http: httpx.AsyncClient,
    session: google_workspace.GoogleSession | None,
) -> str:
    """Fuso da agenda Google para o relógio do turno; sem sessão, usa o padrão da intranet.
    Se o Google falhar, registra e segue com o fuso padrão para não travar a conversa.
    """
    if not session:
        return clock.TIME_ZONE
    try:
        return await session.calendar_time_zone(http)
    except Exception as error:
        logging.warning("Não li o fuso da agenda Google: %s", error)
        return clock.TIME_ZONE


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


def _history_to_messages(history: list[dict[str, Any]], spoken: str) -> list[dict[str, Any]]:
    """Converte o histórico em mensagens do modelo e garante o recado atual."""
    messages = [
        {"role": "assistant" if item["isSecretary"] else "user", "content": item["content"]}
        for item in history
        if item["content"]
    ]
    if spoken and not any(item["role"] == "user" and item["content"] == spoken for item in messages):
        messages.append({"role": "user", "content": spoken})
    return messages


def _needs_agenda_tool(messages: list[dict[str, Any]]) -> bool:
    """Diz se o último recado é um pedido concreto de agenda (verbo + horário).
    Pergunta sobre capacidade ou papo sem horário não entra: o nudge não deve
    interromper conversa simples.
    """
    text = _last_user_text(messages)
    if not text:
        return False
    if any(marker in text for marker in CAPABILITY_MARKERS):
        return False
    has_verb = any(marker in text for marker in AGENDA_WRITE_MARKERS)
    has_when = bool(AGENDA_TIME_HINT.search(text))
    return has_verb and has_when


def _last_user_text(messages: list[dict[str, Any]]) -> str:
    """Texto da última fala do usuário no prompt, para o nudge de agenda.
    Percorre as mensagens de trás para frente, pega a primeira com role user e,
    se o content for string, devolve em minúsculas.
    @param messages histórico já no formato da Messages API (texto ou blocos).
    @returns o texto em minúsculas; string vazia se não houver user, se o content
    for lista de blocos (tool_result) ou se a lista estiver vazia.
    """
    for item in reversed(messages):
        if item.get("role") != "user":
            continue
        content = item.get("content")
        if isinstance(content, str):
            return content.lower()
        return ""
    return ""


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
    messages: list[dict[str, Any]],
    session: google_workspace.GoogleSession | None,
    user_id: int,
) -> str:
    """Roda o loop de tools e só aceita como resposta o texto de uma rodada sem tool calls.
    A sessão Google (se houver) é a mesma em todas as tools do turno, para reusar o access token.
    Cada rodada com tools entra no histórico no formato da Messages API (tool_use + tool_result).
    """
    tools = secretary_tool_definitions()
    tool_outcomes: list[str] = []
    nudged_for_tools = False
    for _ in range(MAX_TOOL_ROUNDS):
        completion = await anthropic_llm.complete(http, system, messages, tools)
        if not completion["toolCalls"]:
            if not nudged_for_tools and _needs_agenda_tool(messages):
                logging.warning("Modelo falou de agenda sem tool; peço a tool neste turno.")
                nudged_for_tools = True
                messages.append({
                    "role": "assistant",
                    "content": completion["text"] or "(sem texto)",
                })
                messages.append({"role": "user", "content": TOOL_NUDGE})
                continue
            return memory.pick_final_reply(completion["text"])
        assistant_blocks, result_blocks, outcomes = await _apply_tool_round(
            http,
            session,
            user_id,
            completion,
        )
        tool_outcomes.extend(outcomes)
        messages.append({"role": "assistant", "content": assistant_blocks})
        messages.append({"role": "user", "content": result_blocks})
    return _reply_after_tool_limit(tool_outcomes)


async def _apply_tool_round(
    http: httpx.AsyncClient,
    session: google_workspace.GoogleSession | None,
    user_id: int,
    completion: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[str]]:
    """Executa as tools da rodada e monta tool_use/tool_result da Messages API.
    O assistente leva o texto (se houver) e um bloco tool_use por chamada; o user
    responde com tool_result apontando o mesmo id, para o modelo ligar o resultado.
    """
    assistant_blocks: list[dict[str, Any]] = []
    if completion["text"]:
        assistant_blocks.append({"type": "text", "text": completion["text"]})
    result_blocks: list[dict[str, Any]] = []
    outcomes: list[str] = []
    for call in completion["toolCalls"]:
        name = str(call.get("name") or "")
        assistant_blocks.append({
            "type": "tool_use",
            "id": call["id"],
            "name": name,
            "input": call.get("arguments") or {},
        })
        line = await _run_secretary_tool(http, session, user_id, call)
        outcomes.append(line)
        result_blocks.append({
            "type": "tool_result",
            "tool_use_id": call["id"],
            "content": line,
        })
    return assistant_blocks, result_blocks, outcomes


def _reply_after_tool_limit(tool_outcomes: list[str]) -> str:
    """Quando o loop estoura, descreve as tools já executadas em vez do fallback genérico."""
    if not tool_outcomes:
        return memory.pick_final_reply("")
    logging.warning(
        "Secretária atingiu o limite de %s rodadas de tools; último lote: %s",
        MAX_TOOL_ROUNDS,
        tool_outcomes[-3:],
    )
    digest = "\n".join(f"- {_short_tool_outcome(line)}" for line in tool_outcomes[-4:])
    return (
        "Fiz as ações abaixo, mas não fechei a confirmação neste turno:\n"
        f"{digest}\n"
        "Se quiser, peço o estado atual da agenda ou das tarefas."
    )


def _short_tool_outcome(line: str) -> str:
    """Corta resultado longo de tool para o fallback visível no chat."""
    if len(line) <= 180:
        return line
    return line[:177] + "..."


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


# Nomes das tools que falam com o Google Calendar/Tasks.
# O despacho usa este conjunto para, sem sessão, devolver o aviso de conexão
# em vez de chamar a API; memória (lembrar/esquecer) fica de fora.
GOOGLE_TOOL_NAMES = {
    "list_events",
    "create_event",
    "update_event",
    "list_tasks",
    "create_task",
    "complete_task",
}


async def _run_secretary_tool(
    http: httpx.AsyncClient,
    session: google_workspace.GoogleSession | None,
    user_id: int,
    call: dict[str, Any],
) -> str:
    """Executa uma tool (Google ou memória) e devolve um resumo em texto para o modelo, rotulado com o nome dela."""
    name = call.get("name") or ""
    arguments = call.get("arguments") or {}
    try:
        result = await _dispatch_tool(http, session, user_id, name, arguments)
        logging.info("Tool da secretária ok: %s", name)
        return f"{name}: " + json.dumps(result, ensure_ascii=False)
    except Exception as error:
        message = str(error) if isinstance(error, Exception) else "falha na ferramenta"
        return f"Erro em {name}: {message}"


async def _dispatch_tool(
    http: httpx.AsyncClient,
    session: google_workspace.GoogleSession | None,
    user_id: int,
    name: str,
    arguments: dict[str, Any],
) -> Any:
    """Encaminha o nome da tool para a função do Google ou da memória.
    Tools do Google sem sessão devolvem o aviso de conexão, sem travar o turno.
    """
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
    if name in GOOGLE_TOOL_NAMES and not session:
        return {"connected": False, "message": SECRETARY_NOT_CONNECTED}
    if name == "list_events":
        return await google_workspace.list_events(
            http, session, str(arguments.get("timeMin") or ""), str(arguments.get("timeMax") or ""),
        )
    if name == "create_event":
        return await google_workspace.create_event(
            http,
            session,
            str(arguments.get("title") or ""),
            str(arguments.get("start") or ""),
            str(arguments.get("end") or ""),
            _optional_string(arguments.get("description")),
        )
    if name == "update_event":
        return await google_workspace.update_event(
            http,
            session,
            str(arguments.get("eventId") or ""),
            _optional_string(arguments.get("title")),
            _optional_string(arguments.get("start")),
            _optional_string(arguments.get("end")),
            _optional_string(arguments.get("description")),
        )
    if name == "list_tasks":
        return await google_workspace.list_tasks(http, session)
    if name == "create_task":
        return await google_workspace.create_task(
            http,
            session,
            str(arguments.get("title") or ""),
            _optional_string(arguments.get("notes")),
            _optional_string(arguments.get("due")),
        )
    if name == "complete_task":
        return await google_workspace.complete_task(
            http,
            session,
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