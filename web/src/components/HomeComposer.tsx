"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Space } from "@/domain/Space";
import { readApiError } from "@/shared/readApiError";

type HomeComposerProps = {
  spaces: Space[];
};

export function HomeComposer({ spaces }: HomeComposerProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? 0);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (spaces.length === 0) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !spaceId) {
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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <p className="text-sm font-semibold text-zinc-900">Nova publicação</p>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="O que está acontecendo?"
        rows={3}
        className="mt-2 w-full resize-none bg-transparent text-[15px] text-zinc-900 outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <select
          value={spaceId}
          onChange={(event) => setSpaceId(Number(event.target.value))}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-700"
        >
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isSending || message.trim() === ""}
          className="h-9 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSending ? "Publicando…" : "Publicar"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
