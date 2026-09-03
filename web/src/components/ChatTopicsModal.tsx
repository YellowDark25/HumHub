"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { ChatTopic } from "@/domain/ChatTopic";
import { TOPIC_MESSAGE_MAX, TOPIC_NAME_MAX } from "@/shared/chatTopic";
import { formatRelativeDate } from "@/shared/format";
import { readApiError } from "@/shared/readApiError";
import { Avatar } from "./Avatar";
import { useOpenChatConversation } from "./ChatSession";
import { ChatTabLink } from "./ChatTabLink";
import { ChatTopicIcon } from "./ChatTopicIcon";
import { useChatTopics } from "./useChatTopics";

type ChatTopicsModalProps = {
  conversationId: number;
  conversationName: string;
  workspaceId: string;
  initialView?: "list" | "create";
  initialMessage?: string;
  onClose: () => void;
};

export function ChatTopicsModal({
  conversationId,
  conversationName,
  workspaceId,
  initialView = "list",
  initialMessage = "",
  onClose,
}: ChatTopicsModalProps) {
  const [view, setView] = useState<"list" | "create">(initialView);
  const dialogRef = useRef<HTMLDivElement>(null);
  const topics = useChatTopics(conversationId, view === "list");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

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

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-topics-title"
        tabIndex={-1}
        className="relative flex max-h-[min(36rem,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl outline-none"
      >
        {view === "create" ? (
          <CreateTopicForm
            conversationId={conversationId}
            conversationName={conversationName}
            workspaceId={workspaceId}
            initialMessage={initialMessage}
            onBack={() => setView("list")}
            onClose={onClose}
          />
        ) : (
          <TopicsList
            conversationName={conversationName}
            workspaceId={workspaceId}
            topics={topics.visibleTopics}
            totalCount={topics.topics.length}
            query={topics.query}
            onQuery={topics.setQuery}
            isLoading={topics.isLoading}
            error={topics.error}
            onCreate={() => setView("create")}
            onClose={onClose}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

function TopicsList({
  conversationName,
  workspaceId,
  topics,
  totalCount,
  query,
  onQuery,
  isLoading,
  error,
  onCreate,
  onClose,
}: {
  conversationName: string;
  workspaceId: string;
  topics: ChatTopic[];
  totalCount: number;
  query: string;
  onQuery: (value: string) => void;
  isLoading: boolean;
  error: string;
  onCreate: () => void;
  onClose: () => void;
}) {
  const heading =
    totalCount === 1 ? "Entrou em 1 tópico" : `Entrou em ${totalCount} tópicos`;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
        <h2
          id="chat-topics-title"
          className="flex shrink-0 items-center gap-2 text-[15px] font-semibold text-zinc-900"
        >
          <ChatTopicIcon className="h-4 w-4 text-zinc-500" />
          Tópicos
        </h2>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Procurar nome do tópico</span>
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Procurar nome do tópico"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-teal-600"
          />
        </label>
        <button
          type="button"
          onClick={onCreate}
          className="h-9 shrink-0 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Criar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {heading}
        </p>
        {isLoading ? (
          <p className="text-sm text-zinc-500">Carregando tópicos…</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!isLoading && !error && topics.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {query.trim()
              ? "Nenhum tópico encontrado."
              : `Nenhum tópico em #${conversationName}.`}
          </p>
        ) : null}
        <ul className="flex flex-col gap-1">
          {topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              workspaceId={workspaceId}
              onClose={onClose}
            />
          ))}
        </ul>
      </div>
    </>
  );
}

/**
 * Linha de um tópico na lista do modal.
 * Abre o tópico nesta aba do chat e fecha o modal.
 */
function TopicRow({
  topic,
  workspaceId,
  onClose,
}: {
  topic: ChatTopic;
  workspaceId: string;
  onClose: () => void;
}) {
  const preview = topic.lastPreview.trim() || "Sem mensagens recentes";
  const when = formatRelativeDate(topic.lastActivityAt);
  const subtitle = when ? `${preview} • ${when}` : preview;

  const openChatConversation = useOpenChatConversation();

  return (
    <li>
      <ChatTabLink
        onOpen={() => {
          onClose();
          openChatConversation(topic.id, workspaceId);
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-zinc-100"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{topic.name}</p>
          <p className="truncate text-xs text-zinc-500">{subtitle}</p>
        </div>
        {topic.starterName ? (
          <Avatar
            name={topic.starterName}
            imageUrl={topic.starterImageUrl}
            size="xs"
            shape="circle"
          />
        ) : null}
      </ChatTabLink>
    </li>
  );
}

function CreateTopicForm({
  conversationId,
  conversationName,
  workspaceId,
  initialMessage = "",
  onBack,
  onClose,
}: {
  conversationId: number;
  conversationName: string;
  workspaceId: string;
  initialMessage?: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const openChatConversation = useOpenChatConversation();
  const [name, setName] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/chat/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          name,
          isPrivate,
          message,
        }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível criar o tópico."));
        return;
      }

      const conversation = (await response.json()) as { id: number };
      onClose();
      openChatConversation(conversation.id, workspaceId);
      router.refresh();
    } catch {
      setError("Falha de rede ao criar o tópico.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <h2 id="chat-topics-title" className="text-[15px] font-semibold text-zinc-900">
          Novo tópico
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            className="h-8 rounded-lg px-2 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-60"
          >
            Voltar
          </button>
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
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <ChatTopicIcon className="h-7 w-7" />
          </span>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Nome do tópico
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, TOPIC_NAME_MAX))}
            placeholder={`Novo tópico em #${conversationName}`}
            maxLength={TOPIC_NAME_MAX}
            required
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-teal-600"
          />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-3 py-3">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            className="mt-1 accent-teal-700"
          />
          <span>
            <span className="block text-sm font-semibold text-zinc-900">
              Tópico particular
            </span>
            <span className="block text-xs text-zinc-500">
              Apenas moderadores e usuários convidados podem ver
            </span>
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Mensagem inicial
          </span>
          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value.slice(0, TOPIC_MESSAGE_MAX))
            }
            placeholder="Digite uma mensagem para começar a conversa!"
            rows={4}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-teal-600"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={onBack}
          className="h-10 rounded-xl px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving || name.trim() === ""}
          className="h-10 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {isSaving ? "Criando…" : "Criar tópico"}
        </button>
      </div>
    </form>
  );
}
