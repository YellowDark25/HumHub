"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatChannelType } from "@/domain/Conversation";
import {
  CHANNEL_TOPIC_MAX,
  SLOW_MODE_OPTIONS,
} from "@/shared/chatChannel";
import { chatWorkspaceHref } from "@/shared/chatWorkspace";
import { readApiError } from "@/shared/readApiError";
import { ChatChannelInvites } from "./ChatChannelInvites";
import { ConfirmDialog } from "./ConfirmDialog";

type SettingsTab = "overview" | "permissions" | "invites" | "integrations";

type ChatChannelSettingsProps = {
  conversationId: number;
  workspaceId: string;
  categoryName: string;
  initialTab: "overview" | "invites";
  onClose: () => void;
};

export function ChatChannelSettings({
  conversationId,
  workspaceId,
  categoryName,
  initialTab,
  onClose,
}: ChatChannelSettingsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [settings, setSettings] = useState<ChannelSettings | null>(null);
  const [loadError, setLoadError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [isDeleting, onClose]);

  useEffect(() => {
    void loadSettings(conversationId)
      .then(setSettings)
      .catch((error: unknown) => {
        setLoadError(
          error instanceof Error ? error.message : "Não foi possível carregar o canal.",
        );
      });
  }, [conversationId]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/chat/channels/${conversationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setLoadError(await readApiError(response, "Não foi possível excluir o canal."));
        return;
      }
      onClose();
      router.push(chatWorkspaceHref(workspaceId));
      router.refresh();
    } catch {
      setLoadError("Falha de rede ao excluir o canal.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  const conversation = settings?.conversation;
  const channelType = conversation?.channelType ?? "text";

  return createPortal(
    <div className="fixed inset-0 z-60 flex bg-zinc-100">
      <aside className="flex w-56 shrink-0 flex-col bg-zinc-200/80 px-3 py-6">
        <p className="mb-3 truncate px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {channelPrefix(channelType)} {conversation?.name ?? "canal"} {categoryName}
        </p>
        <nav className="flex flex-1 flex-col gap-0.5">
          <NavButton label="Visão geral" active={tab === "overview"} onClick={() => setTab("overview")} />
          <NavButton label="Permissões" active={tab === "permissions"} onClick={() => setTab("permissions")} />
          <NavButton label="Convites" active={tab === "invites"} onClick={() => setTab("invites")} />
          <NavButton label="Integrações" active={tab === "integrations"} onClick={() => setTab("integrations")} />
        </nav>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
        >
          <TrashIcon />
          Excluir canal
        </button>
      </aside>
      <section className="relative min-w-0 flex-1 overflow-y-auto px-8 py-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-5 flex h-10 w-10 flex-col items-center justify-center rounded-full border border-zinc-300 text-zinc-500 hover:bg-white hover:text-zinc-800"
          aria-label="Fechar"
        >
          <span className="text-lg leading-none">×</span>
          <span className="text-[9px] font-semibold">ESC</span>
        </button>
        {loadError ? <p className="mb-4 text-sm text-red-600">{loadError}</p> : null}
        {!settings ? (
          <p className="text-sm text-zinc-500">Carregando…</p>
        ) : tab === "overview" ? (
          <OverviewForm
            settings={settings}
            onSaved={(next) => {
              setSettings({ ...settings, conversation: next });
              router.refresh();
            }}
          />
        ) : tab === "permissions" ? (
          <MembersPanel
            conversationId={conversationId}
            members={settings.members}
            onChanged={() => {
              void loadSettings(conversationId).then(setSettings);
              router.refresh();
            }}
          />
        ) : tab === "invites" ? (
          <ChatChannelInvites
            conversationId={conversationId}
            pendingInvites={settings.pendingInvites}
            invitableUsers={settings.invitableUsers}
            onChanged={() => {
              void loadSettings(conversationId).then(setSettings);
            }}
          />
        ) : (
          <IntegrationsPanel />
        )}
      </section>
      <ConfirmDialog
        open={confirmDelete}
        title="Excluir canal"
        description="Essa ação não pode ser desfeita. Mensagens e arquivos do canal serão removidos."
        confirmLabel="Excluir canal"
        tone="danger"
        pending={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>,
    document.body,
  );
}

function OverviewForm({
  settings,
  onSaved,
}: {
  settings: ChannelSettings;
  onSaved: (conversation: ChannelSettings["conversation"]) => void;
}) {
  const [name, setName] = useState(settings.conversation.name);
  const [topic, setTopic] = useState(settings.conversation.topic);
  const [slowModeSeconds, setSlowModeSeconds] = useState(
    settings.conversation.slowModeSeconds,
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/chat/channels/${settings.conversation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, topic, slowModeSeconds }),
        },
      );
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível salvar o canal."));
        return;
      }
      onSaved(await response.json());
    } catch {
      setError("Falha de rede ao salvar o canal.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <h2 className="text-xl font-semibold text-zinc-900">Visão geral</h2>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Nome do canal
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3">
          <span className="text-zinc-400">
            {channelPrefix(settings.conversation.channelType)}
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            className="h-11 flex-1 bg-transparent text-sm outline-none"
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Assunto do canal
        </span>
        <textarea
          value={topic}
          onChange={(event) => setTopic(event.target.value.slice(0, CHANNEL_TOPIC_MAX))}
          rows={4}
          placeholder="Mostre pra todo mundo como se usa este canal!"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none"
        />
        <span className="mt-1 block text-right text-[11px] text-zinc-400">
          {CHANNEL_TOPIC_MAX - topic.length}
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Modo lento
        </span>
        <select
          value={slowModeSeconds}
          onChange={(event) => setSlowModeSeconds(Number(event.target.value))}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none"
        >
          {SLOW_MODE_OPTIONS.map((option) => (
            <option key={option.seconds} value={option.seconds}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          Membros só poderão enviar uma mensagem a cada intervalo deste, a menos
          que tenham permissão para ignorar o modo lento.
        </p>
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSaving}
        className="h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {isSaving ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}

function MembersPanel({
  conversationId,
  members,
  onChanged,
}: {
  conversationId: number;
  members: ChannelSettings["members"];
  onChanged: () => void;
}) {
  const [error, setError] = useState("");

  async function removeMember(userId: number) {
    setError("");
    try {
      const response = await fetch(`/api/chat/channels/${conversationId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível remover o membro."));
        return;
      }
      onChanged();
    } catch {
      setError("Falha de rede ao remover o membro.");
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900">Permissões</h2>
      <p className="text-sm text-zinc-500">
        Quem pode ver e gerenciar este canal.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {members.map((member) => (
          <li key={member.userId} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span>
              <span className="block text-sm font-medium text-zinc-800">{member.name}</span>
              <span className="text-xs text-zinc-500">
                {member.isAdmin ? "Administrador" : "Membro"}
              </span>
            </span>
            {member.isAdmin ? null : (
              <button
                type="button"
                onClick={() => void removeMember(member.userId)}
                className="text-xs font-medium text-red-700 hover:underline"
              >
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function IntegrationsPanel() {
  return (
    <div className="max-w-xl space-y-2">
      <h2 className="text-xl font-semibold text-zinc-900">Integrações</h2>
      <p className="text-sm text-zinc-500">
        Nenhuma integração conectada a este canal.
      </p>
    </div>
  );
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2 py-1.5 text-left text-sm ${
        active ? "bg-zinc-300 font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-300/60"
      }`}
    >
      {label}
    </button>
  );
}

function channelPrefix(type: ChatChannelType | null | undefined) {
  if (type === "voice") {
    return "🔊";
  }
  if (type === "forum") {
    return "💬";
  }
  return "#";
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}

async function loadSettings(conversationId: number): Promise<ChannelSettings> {
  const response = await fetch(`/api/chat/channels/${conversationId}`);
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível carregar o canal."));
  }

  return (await response.json()) as ChannelSettings;
}
