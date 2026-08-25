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
  placeholder: string;
  canManage?: boolean;
  canCreateTopic?: boolean;
  initialMessages: ChatMessage[];
};

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
  placeholder,
  canManage = false,
  canCreateTopic = false,
  initialMessages,
}: ChatConversationPaneProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
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
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
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
        trailing={trailing}
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
  );
}
