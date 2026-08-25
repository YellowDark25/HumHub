"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { readChatForwarded } from "@/domain/ChatForward";
import {
  canDeleteChatMessage,
  canEditChatMessage,
  isEditedChatMessage,
  type ChatMessage,
  type ChatReaction,
} from "@/domain/ChatMessage";
import { chatConversationHref } from "@/shared/chatWorkspace";
import { formatChatClock } from "@/shared/format";
import { readApiError } from "@/shared/readApiError";
import { ChatMessageEditForm } from "./ChatMessageEditForm";
import { ChatMessageMoreMenu } from "./ChatMessageMoreMenu";
import { ChatMessageToolbar } from "./ChatMessageToolbar";
import { ConfirmDialog } from "./ConfirmDialog";

type ChatMessageRowProps = {
  message: ChatMessage;
  currentUserId: number;
  canManage: boolean;
  conversationId: number;
  workspaceId: string;
  canCreateTopic: boolean;
  compact?: boolean;
  now: number;
  onUpdated: (message: ChatMessage) => void;
  onReply: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onCreateTopic: (message: ChatMessage) => void;
  header?: ReactNode;
  children?: ReactNode;
};

export function ChatMessageRow({
  message,
  currentUserId,
  canManage,
  conversationId,
  workspaceId,
  canCreateTopic,
  compact,
  now,
  onUpdated,
  onReply,
  onForward,
  onCreateTopic,
  header,
  children,
}: ChatMessageRowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<"more" | "emoji" | "">("");
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canEdit = canEditChatMessage(message, currentUserId, now);
  const canDelete = canDeleteChatMessage(message, currentUserId, canManage);
  const isActive = menu !== "" || isEditing;

  useEffect(() => {
    if (!menu) {
      return;
    }

    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenu("");
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  async function react(emoji: string) {
    if (menu !== "emoji") {
      setMenu("");
    }
    try {
      const response = await fetch("/api/chat/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, emoji }),
      });
      if (!response.ok) {
        console.error(await readApiError(response, "Não foi possível reagir."));
        return;
      }

      const result = (await response.json()) as {
        reactions: ChatReaction[];
      };
      onUpdated({ ...message, reactions: result.reactions });
    } catch (error) {
      console.error("Falha de rede ao reagir.", error);
    }
  }

  async function remove() {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id }),
      });
      if (!response.ok) {
        console.error(await readApiError(response, "Não foi possível excluir."));
        return;
      }

      onUpdated((await response.json()) as ChatMessage);
      setDeleteOpen(false);
    } catch (error) {
      console.error("Falha de rede ao excluir.", error);
    } finally {
      setIsDeleting(false);
    }
  }

  function copyText() {
    setMenu("");
    const forwarded = readChatForwarded(message.content);
    void navigator.clipboard.writeText(forwarded?.content ?? message.content);
  }

  function copyLink() {
    setMenu("");
    const href = chatConversationHref(conversationId, workspaceId);
    void navigator.clipboard.writeText(`${window.location.origin}${href}#mensagem-${message.id}`);
  }

  function speak() {
    setMenu("");
    const text = readChatForwarded(message.content)?.content ?? message.content;
    if (!text || typeof window.speechSynthesis === "undefined") {
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  return (
    <div
      ref={rootRef}
      id={`mensagem-${message.id}`}
      className={`group relative w-full scroll-mt-8 transition-colors ${
        isActive ? "bg-zinc-100 dark:bg-zinc-200/80" : "hover:bg-zinc-100 dark:hover:bg-zinc-200/80"
      }`}
    >
      <div className={`flex gap-3 px-5 ${compact ? "py-0.5" : "py-1.5"}`}>
        {children}
        <div className="min-w-0 flex-1">
          {header}
          {isEditing ? (
            <ChatMessageEditForm
              message={message}
              onSaved={(updated) => {
                setIsEditing(false);
                onUpdated(updated);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <MessageContent
              message={message}
              onReact={(emoji) => void react(emoji)}
              onAddReaction={() => setMenu("emoji")}
            />
          )}
        </div>
      </div>
      {!message.isDeleted && !isEditing ? (
        <div className={`absolute -top-4 right-4 z-10 ${isActive ? "block" : "hidden group-hover:block"}`}>
          <ChatMessageToolbar
            canEdit={canEdit}
            emojiOpen={menu === "emoji"}
            onReact={(emoji) => void react(emoji)}
            onToggleEmoji={() => setMenu((current) => (current === "emoji" ? "" : "emoji"))}
            onEdit={() => {
              setMenu("");
              setIsEditing(true);
            }}
            onReply={() => {
              setMenu("");
              onReply(message);
            }}
            onMore={() => setMenu((current) => (current === "more" ? "" : "more"))}
          />
          {menu === "more" ? (
            <ChatMessageMoreMenu
              canEdit={canEdit}
              canDelete={canDelete}
              canCreateTopic={canCreateTopic}
              onReact={(emoji) => void react(emoji)}
              onAddReaction={() => setMenu("emoji")}
              onEdit={() => {
                setMenu("");
                setIsEditing(true);
              }}
              onReply={() => {
                setMenu("");
                onReply(message);
              }}
              onForward={() => {
                setMenu("");
                onForward(message);
              }}
              onCreateTopic={() => {
                setMenu("");
                onCreateTopic(message);
              }}
              onCopyText={copyText}
              onCopyLink={copyLink}
              onSpeak={speak}
              onDelete={() => {
                setMenu("");
                setDeleteOpen(true);
              }}
            />
          ) : null}
        </div>
      ) : null}
      <ConfirmDialog
        open={deleteOpen}
        title="Excluir mensagem"
        description="Esta mensagem será excluída para todos."
        confirmLabel="Excluir"
        tone="danger"
        pending={isDeleting}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

export function MessageContent({
  message,
  onReact,
  onAddReaction,
}: {
  message: ChatMessage;
  onReact?: (emoji: string) => void;
  onAddReaction?: () => void;
}) {
  if (message.isDeleted) {
    return <p className="text-[15px] italic text-zinc-400">Mensagem excluída</p>;
  }

  const forwarded = readChatForwarded(message.content);

  return (
    <div className="space-y-2">
      {message.replyTo ? (
        <p className="border-l-2 border-zinc-300 pl-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-600">{message.replyTo.authorName}</span>
          {" · "}
          {message.replyTo.preview}
        </p>
      ) : null}
      {forwarded?.comment ? (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-zinc-800">
          {forwarded.comment}
        </p>
      ) : null}
      {forwarded ? (
        <div className="rounded-lg border-l-2 border-zinc-300 bg-zinc-50 px-3 py-2">
          <p className="text-xs font-semibold text-zinc-500">
            Encaminhada de {forwarded.authorName}
          </p>
          {forwarded.content ? (
            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-6 text-zinc-800">
              {forwarded.content}
              {isEditedChatMessage(message) ? (
                <EditedMark />
              ) : null}
            </p>
          ) : null}
        </div>
      ) : message.content ? (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-zinc-800">
          {message.content}
          {isEditedChatMessage(message) ? <EditedMark /> : null}
        </p>
      ) : null}
      {message.attachments.map((attachment) =>
        attachment.isAudio ? (
          <audio
            key={attachment.id}
            controls
            preload="metadata"
            src={attachment.url}
            className="h-9 max-w-full"
          >
            Seu navegador não reproduz áudio.
          </audio>
        ) : attachment.isImage ? (
          <img
            key={attachment.id}
            src={attachment.url}
            alt={attachment.name}
            className="max-h-64 rounded-lg"
          />
        ) : (
          <a
            key={attachment.id}
            href={attachment.url}
            className="text-sm text-teal-700 hover:underline"
          >
            {attachment.name}
          </a>
        ),
      )}
      {message.reactions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {message.reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              type="button"
              title={reaction.users.join(", ")}
              onClick={() => onReact?.(reaction.emoji)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                reaction.isMine
                  ? "border-teal-300 bg-teal-50 text-teal-800"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
            >
              {reaction.emoji} {reaction.count}
            </button>
          ))}
          {onAddReaction ? (
            <button
              type="button"
              title="Adicionar reação"
              aria-label="Adicionar reação"
              onClick={onAddReaction}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              +
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CompactTime({ publishedAt }: { publishedAt: string | null }) {
  return (
    <span className="flex w-10 shrink-0 justify-end pt-0.5 text-[11px] text-transparent group-hover:text-zinc-400">
      {formatChatClock(publishedAt)}
    </span>
  );
}

function EditedMark() {
  return <span className="ml-1 text-xs text-zinc-400">(editado)</span>;
}
