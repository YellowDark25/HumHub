"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readApiError } from "@/shared/readApiError";

type ChatComposerProps = {
  conversationId: number;
};

export function ChatComposer({ conversationId }: ChatComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    setError("");
    setIsSending(true);
    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: trimmed,
        }),
      });

      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível enviar a mensagem."),
        );
        return;
      }

      setContent("");
      router.refresh();
    } catch {
      setError("Falha de rede ao enviar.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-zinc-200 p-3"
      >
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Mensagem"
          className="h-11 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-teal-600"
        />
        <button
          type="submit"
          disabled={isSending || content.trim() === ""}
          className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
      {error ? (
        <p className="px-3 pb-3 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
