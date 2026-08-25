"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { canManageFriendship, type Person } from "@/domain/Person";
import { readApiError } from "@/shared/readApiError";

type ChatDmPeerActionsProps = {
  person: Person;
};

const ACTION_CLASS =
  "inline-flex h-8 cursor-pointer items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

export function ChatDmPeerActions({ person }: ChatDmPeerActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  if (!canManageFriendship(person)) {
    return null;
  }

  async function run(
    action: "unfollow" | "block",
    confirmText: string,
    fallback: string,
  ) {
    if (!window.confirm(confirmText)) {
      return;
    }

    setError("");
    setBusyAction(action);

    try {
      const response = await fetch(`/api/people/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: person.id }),
      });

      if (!response.ok) {
        setError(await readApiError(response, fallback));
        return;
      }

      router.refresh();
    } catch {
      setError("Falha de rede ao atualizar a relação.");
    } finally {
      setBusyAction("");
    }
  }

  const busy = Boolean(busyAction);

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          void run(
            "unfollow",
            `Encerrar a amizade com ${person.name}?`,
            "Não foi possível desfazer a amizade.",
          )
        }
        className={ACTION_CLASS}
      >
        {busyAction === "unfollow" ? "Removendo…" : "Desfazer amizade"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          void run(
            "block",
            `Bloquear ${person.name}? Vocês deixarão de ser amigos.`,
            "Não foi possível bloquear esta pessoa.",
          )
        }
        className={ACTION_CLASS}
      >
        {busyAction === "block" ? "Bloqueando…" : "Bloquear"}
      </button>
      {error ? <p className="basis-full text-xs text-red-600">{error}</p> : null}
    </>
  );
}
