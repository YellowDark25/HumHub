import logging
from typing import Any

import httpx

import anthropic_llm
import humhub_client
from config import secretary_history_limit

SUMMARY_FOLD_EXTRA = 16
MAX_SUMMARY_CHARS = 2000
FALLBACK_REPLY = "Pronto. Se quiser, peço outro ajuste na agenda ou nas tarefas."

SUMMARY_SYSTEM_PROMPT = """Você atualiza o resumo interno da conversa entre o usuário e a Secretária.
Mantenha só fatos que ainda importam: pedidos, decisões, eventos e tarefas mencionados, preferências.
Ignore confirmações vazias e ruído.
Responda só com o resumo novo, em português, no máximo 8 frases curtas."""


def prompt_history_limit() -> int:
    """Quantas falas cruas entram no prompt junto com o resumo."""
    return secretary_history_limit()


def build_system_prompt(base: str, summary: str, preferences: list[dict[str, str]]) -> str:
    """Junta o prompt base com o resumo da conversa e as preferências gravadas."""
    parts = [base.strip()]
    memory_block = _format_preferences(preferences)
    if memory_block:
        parts.append(memory_block)
    summary_block = _format_summary(summary)
    if summary_block:
        parts.append(summary_block)
    return "\n\n".join(parts)


def pick_final_reply(text: str) -> str:
    """Usa o texto da rodada sem tools; se vazio, cai no fallback explícito."""
    trimmed = text.strip()
    return trimmed or FALLBACK_REPLY


def summary_lookback_limit(raw_limit: int) -> int:
    """Quantas mensagens buscar para o resumo: janela crua mais as que vão envelhecer."""
    return raw_limit + SUMMARY_FOLD_EXTRA


async def refresh_after_turn(http: httpx.AsyncClient, conversation_id: int) -> None:
    """Atualiza o resumo com as mensagens que saíram da janela crua e incrementa o turno."""
    state = await humhub_client.get_conversation_state(http, conversation_id)
    raw_limit = prompt_history_limit()
    lookback = await humhub_client.list_history(
        http,
        conversation_id,
        summary_lookback_limit(raw_limit),
    )
    raw_ids = {item["id"] for item in lookback[-raw_limit:]}
    aged = [
        item
        for item in lookback
        if item["id"] > state["summarizedUpToMessageId"] and item["id"] not in raw_ids
    ]
    to_fold = [item for item in aged if item["content"]]
    summary = state["summary"]
    summarized_up_to = state["summarizedUpToMessageId"]
    if aged:
        if to_fold:
            summary = await _summarize(http, summary, to_fold) or summary
        summarized_up_to = max(item["id"] for item in aged)
    await humhub_client.save_conversation_state(
        http,
        conversation_id,
        summary,
        summarized_up_to,
        state["turnCount"] + 1,
    )


async def _summarize(
    http: httpx.AsyncClient,
    previous: str,
    new_messages: list[dict[str, Any]],
) -> str:
    """Pede ao modelo um resumo curto a partir do texto anterior e das falas que envelheceram."""
    lines = []
    if previous:
        lines.append(f"Resumo anterior:\n{previous}")
    lines.append("Mensagens a incorporar:")
    for item in new_messages:
        who = "Secretária" if item.get("isSecretary") else "Usuário"
        lines.append(f"- {who}: {item['content']}")
    try:
        completion = await anthropic_llm.complete(
            http,
            SUMMARY_SYSTEM_PROMPT,
            [{"role": "user", "content": "\n".join(lines)}],
            [],
        )
    except Exception as error:
        logging.error("Falha ao resumir a conversa da secretária: %s", error)
        return previous
    return (completion["text"].strip() or previous)[:MAX_SUMMARY_CHARS]


def _format_preferences(preferences: list[dict[str, str]]) -> str:
    """Bloco do system prompt com as preferências já gravadas."""
    if not preferences:
        return ""
    lines = ["Preferências gravadas do usuário:"]
    for item in preferences:
        lines.append(f"- {item['key']}: {item['value']}")
    return "\n".join(lines)


def _format_summary(summary: str) -> str:
    """Bloco do system prompt com o resumo rolante da conversa."""
    trimmed = summary.strip()
    if not trimmed:
        return ""
    return f"Resumo da conversa até aqui:\n{trimmed}"
