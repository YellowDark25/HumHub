"use client";

import { useEffect, useState } from "react";
import type { ChannelSettings } from "@/domain/ChannelSettings";
import { readApiError } from "@/shared/readApiError";

type ChatChannelInvitesProps = {
  conversationId: number;
  pendingInvites: ChannelSettings["pendingInvites"];
  invitableUsers: ChannelSettings["invitableUsers"];
  onChanged: () => void;
};

export function ChatChannelInvites({
  conversationId,
  pendingInvites,
  invitableUsers,
  onChanged,
}: ChatChannelInvitesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userId, setUserId] = useState(invitableUsers[0]?.userId ?? 0);
  const [error, setError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [revokingId, setRevokingId] = useState(0);

  useEffect(() => {
    setUserId(invitableUsers[0]?.userId ?? 0);
  }, [invitableUsers]);

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsInviting(true);
    try {
      const response = await fetch(`/api/chat/channels/${conversationId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível enviar o convite."));
        return;
      }
      setIsCreating(false);
      onChanged();
    } catch {
      setError("Falha de rede ao enviar o convite.");
    } finally {
      setIsInviting(false);
    }
  }

  async function revoke(targetUserId: number) {
    setError("");
    setRevokingId(targetUserId);
    try {
      const response = await fetch(`/api/chat/channels/${conversationId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível revogar o convite."));
        return;
      }
      onChanged();
    } catch {
      setError("Falha de rede ao revogar o convite.");
    } finally {
      setRevokingId(0);
    }
  }

  function openCreate() {
    if (isPaused) {
      return;
    }
    setIsCreating(true);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-semibold text-zinc-900">Convites</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Aqui está uma lista de todos os convites ativos. Você pode revogar
        qualquer um ou{" "}
        <button
          type="button"
          onClick={openCreate}
          disabled={isPaused}
          className="font-medium text-teal-700 hover:underline disabled:text-zinc-400 disabled:no-underline"
        >
          criar um novo
        </button>
        .
      </p>
      <button
        type="button"
        onClick={() => {
          setIsPaused((current) => !current);
          setIsCreating(false);
        }}
        className="mt-4 h-9 rounded-lg bg-red-700 px-3 text-sm font-semibold text-white hover:bg-red-800"
      >
        {isPaused ? "Retomar convites" : "Pausar convites"}
      </button>
      <div className="mt-5 border-t border-zinc-200 pt-8">
        {isCreating && !isPaused ? (
          <CreateInviteForm
            userId={userId}
            invitableUsers={invitableUsers}
            error={error}
            isInviting={isInviting}
            onUserIdChange={setUserId}
            onCancel={() => setIsCreating(false)}
            onSubmit={invite}
          />
        ) : pendingInvites.length === 0 ? (
          <EmptyInvites onCreate={openCreate} isPaused={isPaused} />
        ) : (
          <InviteList
            pendingInvites={pendingInvites}
            revokingId={revokingId}
            error={error}
            onRevoke={revoke}
          />
        )}
      </div>
    </div>
  );
}

function CreateInviteForm({
  userId,
  invitableUsers,
  error,
  isInviting,
  onUserIdChange,
  onCancel,
  onSubmit,
}: {
  userId: number;
  invitableUsers: ChannelSettings["invitableUsers"];
  error: string;
  isInviting: boolean;
  onUserIdChange: (userId: number) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <p className="mb-3 text-sm font-semibold text-zinc-800">Criar um convite</p>
      <div className="flex gap-2">
        <select
          value={userId}
          onChange={(event) => onUserIdChange(Number(event.target.value))}
          className="h-11 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
        >
          {invitableUsers.length === 0 ? (
            <option value={0}>Ninguém para convidar</option>
          ) : (
            invitableUsers.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.name}
              </option>
            ))
          )}
        </select>
        <button
          type="submit"
          disabled={isInviting || userId <= 0}
          className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isInviting ? "Enviando…" : "Convidar"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={onCancel}
        className="mt-3 text-sm text-zinc-500 hover:text-zinc-800"
      >
        Cancelar
      </button>
    </form>
  );
}

function InviteList({
  pendingInvites,
  revokingId,
  error,
  onRevoke,
}: {
  pendingInvites: ChannelSettings["pendingInvites"];
  revokingId: number;
  error: string;
  onRevoke: (userId: number) => void;
}) {
  return (
    <div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
        {pendingInvites.map((invite) => (
          <li
            key={invite.userId}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <span>
              <span className="block text-sm font-medium text-zinc-800">
                {invite.name}
              </span>
              <span className="text-xs text-zinc-500">Convite pendente</span>
            </span>
            <button
              type="button"
              disabled={revokingId === invite.userId}
              onClick={() => onRevoke(invite.userId)}
              className="text-sm font-medium text-red-700 hover:underline disabled:opacity-60"
            >
              {revokingId === invite.userId ? "Revogando…" : "Revogar"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyInvites({
  onCreate,
  isPaused,
}: {
  onCreate: () => void;
  isPaused: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <PaperPlaneIcon />
      <p className="mt-6 text-sm font-bold uppercase tracking-wide text-zinc-400">
        Nenhum convite
      </p>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        Sentindo-se perdido? Como um avião de papel sem rumo pelos céus? Crie um
        convite e chame algumas pessoas para cá!
      </p>
      {isPaused ? (
        <p className="mt-4 text-sm text-zinc-500">Os convites estão pausados.</p>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 text-sm font-medium text-teal-700 hover:underline"
        >
          Criar um convite
        </button>
      )}
    </div>
  );
}

function PaperPlaneIcon() {
  return (
    <svg
      viewBox="0 0 160 88"
      className="h-20 w-40 text-zinc-300"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="28" cy="58" rx="18" ry="8" className="fill-zinc-200" />
      <ellipse cx="128" cy="30" rx="22" ry="10" className="fill-zinc-200" />
      <ellipse cx="118" cy="68" rx="16" ry="7" className="fill-zinc-200" />
      <path
        d="M38 58 118 28l-28 22 8 18-16-12-16 8 4-16Z"
        className="fill-zinc-300 stroke-zinc-400"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M90 50 118 28" className="stroke-zinc-400" strokeWidth="1.5" />
    </svg>
  );
}
