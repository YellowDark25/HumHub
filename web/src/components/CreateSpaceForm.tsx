"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readApiError } from "@/shared/readApiError";
import type { Space } from "@/domain/Space";

const MAX_SPACE_NAME_LENGTH = 45;
const MAX_SPACE_DESCRIPTION_LENGTH = 100;

export function CreateSpaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createServer, setCreateServer] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim(),
          createServer,
        }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível criar o espaço."));
        return;
      }

      const space = (await response.json()) as Space;
      router.push(`/espacos/${space.id}`);
      router.refresh();
    } catch {
      setError("Falha de rede ao criar o espaço.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Nome
        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_SPACE_NAME_LENGTH}
          required
          placeholder="Nome do espaço"
          className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-none focus:border-teal-600"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Descrição
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={MAX_SPACE_DESCRIPTION_LENGTH}
          rows={3}
          placeholder="O que acontece neste espaço?"
          className="resize-none rounded-xl border border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 outline-none focus:border-teal-600"
        />
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={createServer}
          onChange={(event) => setCreateServer(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-700"
        />
        <span>
          <span className="font-medium text-zinc-900">Criar servidor no chat</span>
          <span className="mt-0.5 block text-zinc-500">
            Inclui este espaço na barra de servidores, com canais de texto e voz.
          </span>
        </span>
      </label>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting || name.trim() === ""}
        className="h-12 rounded-xl bg-teal-700 text-base font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Criando…" : "Criar espaço"}
      </button>
    </form>
  );
}
