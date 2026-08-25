"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { forwardedSourceContent, type ChatForwardTarget } from "@/domain/ChatForward";
import type { ChatMessage } from "@/domain/ChatMessage";
import { readApiError } from "@/shared/readApiError";
import { Avatar } from "./Avatar";

type ChatForwardModalProps = {
  message: ChatMessage;
  onClose: () => void;
};

type SelectedTarget = {
  conversationId: number | null;
  userId: number | null;
};

export function ChatForwardModal({ message, onClose }: ChatForwardModalProps) {
  const [targets, setTargets] = useState<ChatForwardTarget[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SelectedTarget[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    void loadTargets()
      .then(setTargets)
      .catch((caught: unknown) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "Não foi possível carregar os destinos.",
        );
      });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return targets;
    }

    return targets.filter(
      (target) =>
        target.name.toLowerCase().includes(term) ||
        target.subtitle.toLowerCase().includes(term),
    );
  }, [targets, query]);

  async function send() {
    if (selected.length === 0 || isSending) {
      return;
    }

    setError("");
    setIsSending(true);
    try {
      const response = await fetch("/api/chat/messages/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          conversationIds: selected.flatMap((item) =>
            item.conversationId ? [item.conversationId] : [],
          ),
          userIds: selected.flatMap((item) =>
            item.conversationId || !item.userId ? [] : [item.userId],
          ),
          comment,
        }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível encaminhar."));
        return;
      }

      onClose();
    } catch {
      setError("Falha de rede ao encaminhar.");
    } finally {
      setIsSending(false);
    }
  }

  const preview = forwardedSourceContent(message.content) || "Anexo";

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-forward-title"
        className="relative flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 id="chat-forward-title" className="text-lg font-semibold text-zinc-900">
              Encaminhar para
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Selecione onde você quer compartilhar esta mensagem.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
            aria-label="Fechar"
          >
            ×
          </button>
        </header>
        <div className="px-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-teal-600"
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {visible.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-zinc-500">
              Nenhum destino encontrado.
            </li>
          ) : (
            visible.map((target) => {
              const checked = isSelected(selected, target);
              return (
                <li key={targetKey(target)}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50">
                    <Avatar
                      name={target.name}
                      imageUrl={target.imageUrl}
                      size="sm"
                      shape="circle"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900">
                        {target.kind === "channel" ? `# ${target.name}` : target.name}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {target.subtitle}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelected((current) => toggleTarget(current, target))}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                  </label>
                </li>
              );
            })
          )}
        </ul>
        <div className="border-t border-zinc-200 px-5 py-4">
          <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            {preview}
            {message.editedAt ? " (editado)" : ""}
          </p>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Adicione uma mensagem opcional..."
            rows={2}
            className="mt-3 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={selected.length === 0 || isSending}
              onClick={() => void send()}
              className="h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {isSending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function targetKey(target: ChatForwardTarget): string {
  return target.conversationId
    ? `c:${target.conversationId}`
    : `u:${target.userId}`;
}

function isSelected(selected: SelectedTarget[], target: ChatForwardTarget): boolean {
  return selected.some((item) => sameTarget(item, target));
}

function toggleTarget(selected: SelectedTarget[], target: ChatForwardTarget): SelectedTarget[] {
  if (isSelected(selected, target)) {
    return selected.filter((item) => !sameTarget(item, target));
  }

  return [
    ...selected,
    { conversationId: target.conversationId, userId: target.userId },
  ];
}

function sameTarget(item: SelectedTarget, target: ChatForwardTarget): boolean {
  if (target.conversationId) {
    return item.conversationId === target.conversationId;
  }

  return item.userId === target.userId && !item.conversationId;
}

async function loadTargets(): Promise<ChatForwardTarget[]> {
  const response = await fetch("/api/chat/forward-targets");
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível carregar os destinos."));
  }

  return (await response.json()) as ChatForwardTarget[];
}
