"use client";

import { useEffect, useRef, useState } from "react";
import { readApiError } from "@/shared/readApiError";
import type { ChatMessage } from "@/domain/ChatMessage";

type ChatMessageEditFormProps = {
  message: ChatMessage;
  onSaved: (message: ChatMessage) => void;
  onCancel: () => void;
};

export function ChatMessageEditForm({
  message,
  onSaved,
  onCancel,
}: ChatMessageEditFormProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(message.content);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  async function save() {
    const trimmed = content.trim();
    if (!trimmed || isSaving) {
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, content: trimmed }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível editar a mensagem."));
        return;
      }

      onSaved((await response.json()) as ChatMessage);
    } catch {
      setError("Falha de rede ao editar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-1">
      <textarea
        ref={inputRef}
        value={content}
        disabled={isSaving}
        rows={2}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
            return;
          }
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void save();
          }
        }}
        className="w-full resize-none rounded-lg bg-zinc-100 px-3 py-2 text-[15px] leading-6 text-zinc-800 outline-none"
      />
      <p className="mt-1 text-xs text-zinc-500">
        <button type="button" onClick={onCancel} className="text-teal-700 hover:underline">
          esc
        </button>
        {" para cancelar • "}
        <button type="button" onClick={() => void save()} className="text-teal-700 hover:underline">
          enter
        </button>
        {" para salvar"}
      </p>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
