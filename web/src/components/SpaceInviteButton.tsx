"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { SpaceInvitee } from "@/domain/SpaceInvite";
import { Avatar } from "./Avatar";
import { useSpaceInvite } from "./useSpaceInvite";

type SpaceInviteButtonProps = {
  spaceId: number;
};

export function SpaceInviteButton({ spaceId }: SpaceInviteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
      >
        <InviteIcon />
        Convidar
      </button>
      {open ? (
        <SpaceInviteModal spaceId={spaceId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function SpaceInviteModal({
  spaceId,
  onClose,
}: {
  spaceId: number;
  onClose: () => void;
}) {
  const invite = useSpaceInvite(spaceId, true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !invite.isSending) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [invite.isSending, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = await invite.send();
    if (sent) {
      onClose();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        disabled={invite.isSending}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-invite-title"
        className="relative flex max-h-[min(640px,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2
              id="space-invite-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Convidar membros
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Para convidar usuários para este espaço, por favor digite os
              nomes abaixo para encontrá-los e adicioná-los.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={invite.isSending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Fechar"
          >
            ×
          </button>
        </header>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <InvitePicker invite={invite} />
            <fieldset className="mt-4 space-y-3">
              <InviteOption
                checked={invite.selectAllRegistered}
                disabled={invite.isSending}
                onChange={invite.setSelectAllRegistered}
                label="Selecione todos os usuários registrados"
              />
              <InviteOption
                checked={invite.addWithoutInvite}
                disabled={invite.isSending}
                onChange={invite.setAddWithoutInvite}
                label="Adicione usuários sem convite"
              />
              <InviteOption
                checked={invite.addAsDefaultSpace}
                disabled={invite.isSending}
                onChange={invite.setAddAsDefaultSpace}
                label="Adicionar como Espaço padrão para novos usuários"
              />
            </fieldset>
            {invite.error ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {invite.error}
              </p>
            ) : null}
          </div>
          <footer className="border-t border-zinc-200 px-5 py-4">
            <button
              type="submit"
              disabled={invite.isSending || invite.isLoading}
              className="h-11 w-full rounded-xl bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {invite.isSending ? "Enviando…" : "Enviar"}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function InvitePicker({ invite }: { invite: ReturnType<typeof useSpaceInvite> }) {
  const showSuggestions =
    !invite.selectAllRegistered &&
    !invite.isLoading &&
    (invite.query.trim() !== "" || invite.suggestions.length > 0);

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-zinc-900">
        Convites
      </span>
      {invite.selectedUsers.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-2">
          {invite.selectedUsers.map((user) => (
            <li key={user.id}>
              <SelectedUserChip
                user={user}
                disabled={invite.isSending || invite.selectAllRegistered}
                onRemove={() => invite.removeUser(user.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <input
        value={invite.query}
        onChange={(event) => invite.setQuery(event.target.value)}
        placeholder="Adicionar usuário"
        disabled={invite.isSending || invite.selectAllRegistered}
        className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-teal-600 disabled:opacity-60"
      />
      {invite.isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">Carregando usuários…</p>
      ) : null}
      {showSuggestions ? (
        <SuggestionList
          users={invite.suggestions}
          empty={invite.users.length === 0}
          onSelect={invite.addUser}
        />
      ) : null}
    </label>
  );
}

function SelectedUserChip({
  user,
  disabled,
  onRemove,
}: {
  user: SpaceInvitee;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1 pr-2 pl-1 text-sm text-zinc-800">
      <Avatar name={user.name} imageUrl={user.imageUrl} size="xs" shape="circle" />
      <span className="max-w-40 truncate">{user.name}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="text-zinc-400 hover:text-zinc-700"
        aria-label={`Remover ${user.name}`}
      >
        ×
      </button>
    </span>
  );
}

function SuggestionList({
  users,
  empty,
  onSelect,
}: {
  users: SpaceInvitee[];
  empty: boolean;
  onSelect: (userId: number) => void;
}) {
  if (empty) {
    return (
      <p className="mt-2 text-sm text-zinc-500">
        Ninguém disponível para convite.
      </p>
    );
  }

  if (users.length === 0) {
    return (
      <p className="mt-2 text-sm text-zinc-500">Nenhum usuário encontrado.</p>
    );
  }

  return (
    <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-200">
      {users.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            onClick={() => onSelect(user.id)}
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50"
          >
            <Avatar name={user.name} imageUrl={user.imageUrl} size="sm" shape="circle" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-zinc-800">
                {user.name}
              </span>
              {user.username ? (
                <span className="block truncate text-xs text-zinc-500">
                  @{user.username}
                </span>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function InviteOption({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-700"
      />
      {label}
    </label>
  );
}

function InviteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}
