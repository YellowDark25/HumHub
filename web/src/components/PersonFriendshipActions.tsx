"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  canMessagePerson,
  type FriendshipStatus,
  type Person,
} from "@/domain/Person";
import { readApiError } from "@/shared/readApiError";

type PersonFriendshipActionsProps = {
  person: Person;
};

export function PersonFriendshipActions({
  person,
}: PersonFriendshipActionsProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(person);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  if (current.isSelf) {
    return null;
  }

  async function changeFriendship(action: "follow" | "unfollow") {
    setError("");
    setBusyAction(action);

    try {
      const response = await fetch(`/api/people/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: current.id }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível atualizar a amizade."));
        return;
      }

      setCurrent((await response.json()) as Person);
      router.refresh();
    } catch {
      setError("Falha de rede ao atualizar a amizade.");
    } finally {
      setBusyAction("");
    }
  }

  async function openMessage() {
    setError("");
    setBusyAction("message");

    try {
      const response = await fetch("/api/chat/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: current.id }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível abrir a conversa."));
        return;
      }

      const conversation = (await response.json()) as { id: number };
      router.push(`/chat/${conversation.id}`);
    } catch {
      setError("Falha de rede ao abrir a conversa.");
    } finally {
      setBusyAction("");
    }
  }

  const busy = Boolean(busyAction);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {buttonsFor(current.friendship).map((button) => (
          <button
            key={button.id}
            type="button"
            disabled={busy}
            onClick={() => {
              if (button.confirm && !window.confirm(button.confirm(current.name))) {
                return;
              }
              void changeFriendship(button.action);
            }}
            className={button.className}
          >
            {busyAction === button.action ? button.pendingLabel : button.label}
          </button>
        ))}
        {canMessagePerson(current) ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void openMessage()}
            className={secondaryButtonClass}
          >
            {busyAction === "message" ? "Abrindo…" : "Mensagem"}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

type FriendshipButton = {
  id: string;
  action: "follow" | "unfollow";
  label: string;
  pendingLabel: string;
  className: string;
  confirm?: (name: string) => string;
};

const primaryButtonClass =
  "rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50";
const secondaryButtonClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 disabled:opacity-50";

function buttonsFor(status: FriendshipStatus): FriendshipButton[] {
  if (status === "outgoing") {
    return [
      {
        id: "pending",
        action: "unfollow",
        label: "Pendente",
        pendingLabel: "Cancelando…",
        className: secondaryButtonClass,
        confirm: (name) => `Cancelar o pedido de amizade enviado para ${name}?`,
      },
    ];
  }

  if (status === "incoming") {
    return [
      {
        id: "accept",
        action: "follow",
        label: "Aceitar",
        pendingLabel: "Aceitando…",
        className: primaryButtonClass,
      },
      {
        id: "deny",
        action: "unfollow",
        label: "Recusar",
        pendingLabel: "Recusando…",
        className: secondaryButtonClass,
        confirm: (name) => `Recusar o pedido de amizade de ${name}?`,
      },
    ];
  }

  if (status === "friends") {
    return [
      {
        id: "friends",
        action: "unfollow",
        label: "Amigos",
        pendingLabel: "Removendo…",
        className: secondaryButtonClass,
        confirm: (name) => `Encerrar a amizade com ${name}?`,
      },
    ];
  }

  return [
    {
      id: "follow",
      action: "follow",
      label: "Seguir",
      pendingLabel: "Enviando…",
      className: primaryButtonClass,
    },
  ];
}
