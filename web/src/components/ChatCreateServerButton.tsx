"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Space } from "@/domain/Space";
import { chatWorkspaceHref } from "@/shared/chatWorkspace";
import { Avatar } from "./Avatar";
import {
  MAX_SERVER_NAME_LENGTH,
  useCreateChatServer,
} from "./useCreateChatServer";

type ChatCreateServerButtonProps = {
  canCreateNew: boolean;
  currentUserName: string;
  spacesWithoutServer: Space[];
};

export function ChatCreateServerButton({
  canCreateNew,
  currentUserName,
  spacesWithoutServer,
}: ChatCreateServerButtonProps) {
  const [open, setOpen] = useState(false);

  if (!canCreateNew && spacesWithoutServer.length === 0) {
    return null;
  }

  return (
    <>
      <div className="hidden h-0.5 w-8 rounded-full bg-zinc-300 lg:block" />
      <button
        type="button"
        title="Adicionar um servidor"
        aria-label="Adicionar um servidor"
        onClick={() => setOpen(true)}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-teal-700 transition-[border-radius,background-color,color] hover:rounded-2xl hover:bg-teal-700 hover:text-white"
      >
        <PlusIcon />
      </button>
      {open ? (
        <CreateServerModal
          canCreateNew={canCreateNew}
          currentUserName={currentUserName}
          spacesWithoutServer={spacesWithoutServer}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CreateServerModal({
  canCreateNew,
  currentUserName,
  spacesWithoutServer,
  onClose,
}: ChatCreateServerButtonProps & { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const form = useCreateChatServer(defaultServerName(currentUserName));
  const isBusy = form.isSaving || form.enablingSpaceId > 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [isBusy, onClose]);

  async function handleCreated(spaceId: number | null) {
    if (!spaceId) {
      return;
    }

    onClose();
    router.push(chatWorkspaceHref(String(spaceId)));
    router.refresh();
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        disabled={isBusy}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-server-title"
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="create-server-title"
              className="text-lg font-semibold text-zinc-900"
            >
              {canCreateNew
                ? "Personalize o seu servidor"
                : "Adicionar um servidor"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {canCreateNew
                ? "Dê um nome e um ícone ao novo servidor. Você pode mudar depois."
                : "Escolha um espaço para aparecer na barra de servidores."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-60"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {canCreateNew ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void form.createServer().then(handleCreated);
            }}
          >
            <div className="flex justify-center">
              <button
                type="button"
                onClick={form.openFilePicker}
                disabled={form.isSaving}
                className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-zinc-300 text-zinc-400 hover:border-teal-600 hover:text-teal-700 disabled:opacity-60"
                aria-label="Enviar ícone do servidor"
              >
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                  {form.imageDataUrl ? (
                    <img
                      src={form.imageDataUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center text-[10px] font-semibold tracking-wide">
                      <CameraIcon />
                      ENVIAR
                    </span>
                  )}
                </span>
                <span className="absolute -top-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white">
                  <PlusIcon className="h-3.5 w-3.5" />
                </span>
              </button>
              <input
                ref={form.fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(event) =>
                  void form.onFileSelected(event.target.files?.[0])
                }
              />
            </div>
            {form.imageDataUrl ? (
              <button
                type="button"
                onClick={form.clearImage}
                className="mx-auto block text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                Remover ícone
              </button>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Nome do servidor *
              </span>
              <input
                value={form.name}
                onChange={(event) => form.setName(event.target.value)}
                maxLength={MAX_SERVER_NAME_LENGTH}
                required
                placeholder="Nome do servidor"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-teal-600"
              />
            </label>
            {form.error ? <p className="text-sm text-red-600">{form.error}</p> : null}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isBusy}
                onClick={onClose}
                className="h-10 rounded-xl px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={form.isSaving || form.name.trim() === ""}
                className="h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {form.isSaving ? "Criando…" : "Criar"}
              </button>
            </div>
          </form>
        ) : form.error ? (
          <p className="text-sm text-red-600">{form.error}</p>
        ) : null}

        {spacesWithoutServer.length > 0 ? (
          <div className={canCreateNew ? "mt-5 border-t border-zinc-200 pt-4" : ""}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {canCreateNew
                ? "Ou adicione um espaço existente"
                : "Espaços sem servidor"}
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {spacesWithoutServer.map((space) => (
                <li key={space.id}>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      void form.enableExistingSpace(space.id).then(handleCreated)
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-zinc-50 disabled:opacity-60"
                  >
                    <Avatar
                      name={space.name}
                      imageUrl={space.imageUrl}
                      size="sm"
                      shape="circle"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">
                      {space.name}
                    </span>
                    <span className="text-xs text-teal-700">
                      {form.enablingSpaceId === space.id ? "Adicionando…" : "Adicionar"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function defaultServerName(userName: string) {
  const trimmed = userName.trim();
  const name = trimmed ? `Servidor de ${trimmed}` : "";
  return name.slice(0, MAX_SERVER_NAME_LENGTH);
}

function PlusIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mb-0.5 h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}
