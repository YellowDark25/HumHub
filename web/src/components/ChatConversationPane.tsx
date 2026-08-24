"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatMessage } from "@/domain/ChatMessage";
import {
  applyChatLiveEvent,
  lastChatMessageId,
  upsertChatMessage,
} from "@/shared/chatLive";
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
  placeholder: string;
  initialMessages: ChatMessage[];
};

export function ChatConversationPane({
  conversationId,
  currentUserId,
  workspaceId,
  conversationName,
  title,
  trailing,
  placeholder,
  initialMessages,
}: ChatConversationPaneProps) {
  const [messages, setMessages] = useState(initialMessages);
  const typers = useChatTypers(currentUserId);
  const historyRef = useRef<HTMLDivElement>(null);

  useChatLive(conversationId, lastChatMessageId(messages), (event) => {
    typers.onLiveEvent(event);
    setMessages((current) => applyChatLiveEvent(current, event));
  });

  useEffect(() => {
    const history = historyRef.current;
    if (!history) {
      return;
    }

    history.scrollTop = history.scrollHeight;
  }, [messages]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatPaneHeader title={title} trailing={trailing} />
      <div
        ref={historyRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="flex min-h-full flex-col justify-end">
          <ChatMessageHistory messages={messages} />
        </div>
      </div>
      <ChatTypingIndicator label={typers.label} />
      <ChatComposer
        conversationId={conversationId}
        workspaceId={workspaceId}
        conversationName={conversationName}
        placeholder={placeholder}
        onSent={(message) =>
          setMessages((current) => upsertChatMessage(current, message))
        }
      />
    </section>
  );
}
