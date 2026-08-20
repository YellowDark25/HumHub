"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readApiError } from "@/shared/readApiError";

type ComposerProps = {
  spaceId: number;
};

export function PostComposer({ spaceId }: ComposerProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId, message: trimmed }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível publicar."));
        return;
      }

      setMessage("");
      router.refresh();
    } catch {
      setError("Falha de rede ao publicar.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-3">
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Escreva no espaço…"
        rows={3}
        className="w-full resize-none bg-transparent text-[15px] text-zinc-900 outline-none"
      />
      {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSending || message.trim() === ""}
          className="h-9 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSending ? "Publicando…" : "Publicar"}
        </button>
      </div>
    </form>
  );
}
