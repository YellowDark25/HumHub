"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatMessage } from "@/domain/ChatMessage";
import {
  applyChatLiveEvent,
  lastChatMessageId,
  upsertChatMessage,
} from "@/shared/chatLive";
import { chatWorkspaceHref } from "@/shared/chatWorkspace";
import Link from "next/link";
import { subscribeChatMessages } from "./chatMessageEvents";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageHistory } from "./ChatMessageHistory";
import { ChatMemberPanel } from "./ChatMemberPanel";
import { ChatMembersButton } from "./ChatMembersButton";
import { ChatPaneHeader } from "./ChatPaneHeader";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import { useChatLive } from "./useChatLive";
import { useChatTypers } from "./useChatTypers";

type ChatConversationPaneProps = {
  conversationId: number;
  currentUserId: number;
  workspaceId?: string;
  conversationName?: string;
  title: ReactNode;
  trailing?: ReactNode;
  banner?: ReactNode;
  overlay?: ReactNode;
  intro?: ReactNode;
  membersConversationId?: number | null;
  placeholder: string;
  canManage?: boolean;
  canCreateTopic?: boolean;
  initialMessages: ChatMessage[];
};

/**
 * Monta o painel da conversa e a lista lateral de membros do canal.
 * Atualiza as mensagens pelo live; o ícone de pessoas abre o roster agrupado por status.
 */
export function ChatConversationPane({
  conversationId,
  currentUserId,
  workspaceId,
  conversationName,
  title,
  trailing,
  banner,
  overlay,
  intro,
  membersConversationId = null,
  placeholder,
  canManage = false,
  canCreateTopic = false,
  initialMessages,
}: ChatConversationPaneProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const typers = useChatTypers(currentUserId);
  const historyRef = useRef<HTMLDivElement>(null);

  useChatLive(conversationId, lastChatMessageId(messages), (event) => {
    typers.onLiveEvent(event);
    setMessages((current) => applyChatLiveEvent(current, event, currentUserId));
  });

  useEffect(() => {
    return subscribeChatMessages((id, message) => {
      if (id !== conversationId) {
        return;
      }

      setMessages((current) => upsertChatMessage(current, message));
    });
  }, [conversationId]);

  useEffect(() => {
    const history = historyRef.current;
    if (!history) {
      return;
    }

    history.scrollTop = history.scrollHeight;
  }, [messages]);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ChatPaneHeader
        title={
          <>
            {workspaceId ? (
              <Link
                href={chatWorkspaceHref(workspaceId)}
                className="text-sm font-medium text-teal-700 lg:hidden"
              >
                Voltar
              </Link>
            ) : null}
            {title}
          </>
        }
        trailing={
          <div className="flex items-center gap-0.5">
            {trailing}
            {membersConversationId ? (
              <ChatMembersButton
                open={membersOpen}
                onToggle={() => setMembersOpen((current) => !current)}
              />
            ) : null}
          </div>
        }
      />
      {banner ? <div className="contents">{banner}</div> : null}
      {overlay ? <div className="contents">{overlay}</div> : null}
      <div
        ref={historyRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="flex min-h-full flex-col justify-end">
          <ChatMessageHistory
            messages={messages}
            currentUserId={currentUserId}
            canManage={canManage}
            conversationId={conversationId}
            workspaceId={workspaceId}
            conversationName={conversationName}
            canCreateTopic={canCreateTopic}
            intro={intro}
            onUpdated={(message) =>
              setMessages((current) => upsertChatMessage(current, message))
            }
            onReply={setReplyTo}
          />
        </div>
      </div>
      <ChatTypingIndicator label={typers.label} />
      <ChatComposer
        conversationId={conversationId}
        workspaceId={workspaceId}
        conversationName={conversationName}
        placeholder={placeholder}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSent={(message) =>
          setMessages((current) => upsertChatMessage(current, message))
        }
      />
    </section>
      {membersConversationId && membersOpen ? (
        <>
          <button
            type="button"
            aria-label="Fechar membros"
            onClick={() => setMembersOpen(false)}
            className="absolute inset-0 z-10 bg-zinc-900/20 lg:hidden"
          />
          <ChatMemberPanel
            conversationId={membersConversationId}
            currentUserId={currentUserId}
            onClose={() => setMembersOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}
