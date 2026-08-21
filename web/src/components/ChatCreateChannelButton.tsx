"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChatChannelType } from "@/domain/Conversation";
import { chatConversationHref } from "@/shared/chatWorkspace";
import { readApiError } from "@/shared/readApiError";

type ChatCreateChannelButtonProps = {
  workspaceId: string;
  spaceId: number | null;
  categoryName: string;
  defaultType: ChatChannelType;
};

const CHANNEL_TYPES: {
  type: ChatChannelType;
  title: string;
  description: string;
}[] = [
  {
    type: "text",
    title: "Texto",
    description: "Envie mensagens, imagens, GIFs, emojis, opiniões e piadas",
  },
  {
    type: "voice",
    title: "Voz",
    description: "Passe tempo com a turma com voz, vídeo e compartilhamento de tela",
  },
  {
    type: "forum",
    title: "Fórum",
    description: "Crie um espaço para discussões organizadas",
  },
];

export function ChatCreateChannelButton({
  workspaceId,
  spaceId,
  categoryName,
  defaultType,
}: ChatCreateChannelButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        title="Criar canal"
        aria-label={`Criar canal em ${categoryName}`}
        onClick={() => setOpen(true)}
        className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
      >
        <PlusIcon />
      </button>
      {open ? (
        <CreateChannelModal
          workspaceId={workspaceId}
          spaceId={spaceId}
          categoryName={categoryName}
          defaultType={defaultType}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CreateChannelModal({
  workspaceId,
  spaceId,
  categoryName,
  defaultType,
  onClose,
}: ChatCreateChannelButtonProps & { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [channelType, setChannelType] = useState<ChatChannelType>(defaultType);
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [isSaving, onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channelType,
          spaceId,
          isPrivate,
        }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível criar o canal."));
        return;
      }

      const conversation = (await response.json()) as { id: number };
      onClose();
      router.push(chatConversationHref(conversation.id, workspaceId));
      router.refresh();
    } catch {
      setError("Falha de rede ao criar o canal.");
    } finally {
      setIsSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        disabled={isSaving}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-channel-title"
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="create-channel-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Criar canal
            </h2>
            <p className="text-sm text-zinc-500">em {categoryName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Tipo de canal
            </legend>
            {CHANNEL_TYPES.map((option) => (
              <label
                key={option.type}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${
                  channelType === option.type
                    ? "border-teal-600 bg-teal-50"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="radio"
                  name="channelType"
                  value={option.type}
                  checked={channelType === option.type}
                  onChange={() => setChannelType(option.type)}
                  className="mt-1 accent-teal-600"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <ChannelTypeIcon type={option.type} />
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Nome do canal
            </span>
            <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3">
              <span className="text-zinc-400">
                <ChannelTypeIcon type={channelType} />
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="novo-canal"
                maxLength={100}
                required
                className="h-11 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
              />
            </span>
          </label>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Canal privado</p>
              <p className="text-xs text-zinc-500">
                Somente membros e cargos selecionados poderão visualizar esse canal.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              onClick={() => setIsPrivate((current) => !current)}
              className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                isPrivate ? "bg-teal-600" : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isPrivate ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="h-10 rounded-xl px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || name.trim() === ""}
              className="h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {isSaving ? "Criando…" : "Criar canal"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function ChannelTypeIcon({ type }: { type: ChatChannelType }) {
  if (type === "voice") {
    return <SpeakerIcon />;
  }

  if (type === "forum") {
    return <ForumIcon />;
  }

  return <span className="w-3 text-center">#</span>;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10v4h3l5 4V6L7 10H4Z" />
      <path d="M16 9.5a4 4 0 0 1 0 5" />
    </svg>
  );
}

function ForumIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 6h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <path d="M17 9h2a2 2 0 0 1 2 2v5h-2l-3 2v-2h-1" />
    </svg>
  );
}
