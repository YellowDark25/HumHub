"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ChannelInvitee, ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatChannelType } from "@/domain/Conversation";
import { chatConversationHref } from "@/shared/chatWorkspace";
import { readApiError } from "@/shared/readApiError";
import { Avatar } from "./Avatar";

type ChatInviteFriendsModalProps = {
  conversationId: number;
  workspaceId: string;
  workspaceName: string;
  channelName: string;
  channelType: ChatChannelType | null;
  onClose: () => void;
  onEditInvites: () => void;
};

export function ChatInviteFriendsModal({
  conversationId,
  workspaceId,
  workspaceName,
  channelName,
  channelType,
  onClose,
  onEditInvites,
}: ChatInviteFriendsModalProps) {
  const [people, setPeople] = useState<ChannelInvitee[]>([]);
  const [query, setQuery] = useState("");
  const [invitedIds, setInvitedIds] = useState<number[]>([]);
  const [busyId, setBusyId] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inviteLink = inviteUrl(conversationId, workspaceId);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    void loadInvitees(conversationId)
      .then(setPeople)
      .catch((caught: unknown) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "Não foi possível carregar as pessoas.",
        );
      });
  }, [conversationId]);

  const visiblePeople = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return people;
    }

    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(term) ||
        person.username.toLowerCase().includes(term),
    );
  }, [people, query]);

  async function invite(userId: number) {
    setError("");
    setBusyId(userId);
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
      setInvitedIds((current) => [...current, userId]);
    } catch {
      setError("Falha de rede ao enviar o convite.");
    } finally {
      setBusyId(0);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link.");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-zinc-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-friends-title"
        className="relative flex max-h-[min(640px,90vh)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
      >
        <header className="px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="invite-friends-title"
                className="text-lg font-semibold text-zinc-900"
              >
                Convidar amigos para {workspaceName}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Os destinatários chegarão em {channelPrefix(channelType)} {channelName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
          <label className="relative mt-4 block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar amigos"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none focus:border-teal-600"
            />
          </label>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {error ? <p className="px-2 pb-2 text-sm text-red-600">{error}</p> : null}
          {visiblePeople.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-zinc-500">
              Nenhuma pessoa encontrada.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {visiblePeople.map((person) => {
                const invited = invitedIds.includes(person.userId);
                return (
                  <li
                    key={person.userId}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50"
                  >
                    <Avatar
                      name={person.name}
                      imageUrl={person.imageUrl}
                      size="sm"
                      shape="circle"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-800">
                        {person.name}
                      </span>
                      {person.username ? (
                        <span className="block truncate text-xs text-zinc-500">
                          @{person.username}
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      disabled={invited || busyId === person.userId}
                      onClick={() => void invite(person.userId)}
                      className="h-8 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:border-teal-200 disabled:bg-teal-50 disabled:text-teal-800"
                    >
                      {invited
                        ? "Enviado"
                        : busyId === person.userId
                          ? "Enviando…"
                          : "Convidar"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <footer className="border-t border-zinc-200 px-5 py-4">
          <p className="mb-2 text-sm font-medium text-zinc-700">
            Ou, envie um convite do servidor a um amigo
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="h-10 flex-1 truncate rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600"
            />
            <button
              type="button"
              onClick={() => void copyLink()}
              className="h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Seu link de convite leva ao canal.{" "}
            <button
              type="button"
              onClick={onEditInvites}
              className="font-medium text-teal-700 hover:underline"
            >
              Editar convites
            </button>
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function channelPrefix(type: ChatChannelType | null) {
  if (type === "voice") {
    return "";
  }
  if (type === "forum") {
    return "";
  }
  return "#";
}

function inviteUrl(conversationId: number, workspaceId: string) {
  if (typeof window === "undefined") {
    return chatConversationHref(conversationId, workspaceId);
  }

  return `${window.location.origin}${chatConversationHref(conversationId, workspaceId)}`;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

async function loadInvitees(conversationId: number): Promise<ChannelInvitee[]> {
  const response = await fetch(`/api/chat/channels/${conversationId}`);
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível carregar as pessoas."));
  }

  const settings = (await response.json()) as ChannelSettings;
  return settings.invitableUsers;
}
