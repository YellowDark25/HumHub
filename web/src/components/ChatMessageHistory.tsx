"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  chatCallActionLabel,
  readChatCallEvent,
  type ChatCallEvent,
} from "@/domain/ChatCallEvent";
import { forwardedSourceContent } from "@/domain/ChatForward";
import type { ChatMessage } from "@/domain/ChatMessage";
import {
  type ChatHistoryGroup,
  groupChatHistory,
} from "@/shared/chatHistory";
import { formatChatClock, formatChatTimestamp } from "@/shared/format";
import { Avatar } from "./Avatar";
import { ChatForwardModal } from "./ChatForwardModal";
import {
  ChatMessageRow,
  CompactTime,
} from "./ChatMessageRow";
import { ChatTopicsModal } from "./ChatTopicsModal";

const EDIT_WINDOW_TICK_MS = 15_000;

type ChatMessageHistoryProps = {
  messages: ChatMessage[];
  currentUserId: number;
  canManage: boolean;
  conversationId: number;
  workspaceId?: string;
  conversationName?: string;
  canCreateTopic: boolean;
  intro?: ReactNode;
  onUpdated: (message: ChatMessage) => void;
  onReply: (message: ChatMessage) => void;
};

export function ChatMessageHistory({
  messages,
  currentUserId,
  canManage,
  conversationId,
  workspaceId = "",
  conversationName = "",
  canCreateTopic,
  intro,
  onUpdated,
  onReply,
}: ChatMessageHistoryProps) {
  const items = groupChatHistory(messages);
  const [now, setNow] = useState(() => Date.now());
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const [topicMessage, setTopicMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), EDIT_WINDOW_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (items.length === 0 && !intro) {
    return <p className="px-5 py-6 text-[15px] text-zinc-500">Nenhuma mensagem ainda.</p>;
  }

  return (
    <div className="flex flex-col py-2">
      {intro}
      {items.map((item) =>
        item.type === "day" ? (
          <DayDivider key={item.key} label={item.label} />
        ) : (
          <MessageGroup
            key={item.key}
            group={item}
            currentUserId={currentUserId}
            canManage={canManage}
            conversationId={conversationId}
            workspaceId={workspaceId}
            canCreateTopic={canCreateTopic}
            now={now}
            onUpdated={onUpdated}
            onReply={onReply}
            onForward={setForwardMessage}
            onCreateTopic={setTopicMessage}
          />
        ),
      )}
      {forwardMessage ? (
        <ChatForwardModal
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
        />
      ) : null}
      {topicMessage && workspaceId ? (
        <ChatTopicsModal
          conversationId={conversationId}
          conversationName={conversationName}
          workspaceId={workspaceId}
          initialView="create"
          initialMessage={topicStarter(topicMessage)}
          onClose={() => setTopicMessage(null)}
        />
      ) : null}
    </div>
  );
}

function topicStarter(message: ChatMessage): string {
  const forwarded = forwardedSourceContent(message.content);
  return forwarded || message.content;
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3 px-5">
      <span className="h-px flex-1 bg-zinc-200" />
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

function MessageGroup({
  group,
  currentUserId,
  canManage,
  conversationId,
  workspaceId,
  canCreateTopic,
  now,
  onUpdated,
  onReply,
  onForward,
  onCreateTopic,
}: {
  group: ChatHistoryGroup;
  currentUserId: number;
  canManage: boolean;
  conversationId: number;
  workspaceId: string;
  canCreateTopic: boolean;
  now: number;
  onUpdated: (message: ChatMessage) => void;
  onReply: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onCreateTopic: (message: ChatMessage) => void;
}) {
  const [first, ...rest] = group.messages;

  if (!first) {
    return null;
  }

  const callEvent = readChatCallEvent(first.content);
  if (callEvent) {
    return <CallStatusLine message={first} event={callEvent} />;
  }

  const rowProps = {
    currentUserId,
    canManage,
    conversationId,
    workspaceId,
    canCreateTopic,
    now,
    onUpdated,
    onReply,
    onForward,
    onCreateTopic,
  };

  return (
    <div className="mt-2">
      <ChatMessageRow
        message={first}
        {...rowProps}
        header={
          <p className="flex flex-wrap items-baseline gap-x-2 leading-5">
            <span className="text-[15px] font-semibold text-zinc-900">
              {group.authorName}
            </span>
            <time className="text-xs text-zinc-400">
              {formatChatTimestamp(group.publishedAt)}
            </time>
          </p>
        }
      >
        <Avatar
          name={group.authorName}
          imageUrl={group.authorImageUrl}
          size="md"
          shape="circle"
        />
      </ChatMessageRow>
      {rest.map((message) => (
        <ChatMessageRow key={message.id} message={message} compact {...rowProps}>
          <CompactTime publishedAt={message.publishedAt} />
        </ChatMessageRow>
      ))}
    </div>
  );
}

function CallStatusLine({
  message,
  event,
}: {
  message: ChatMessage;
  event: ChatCallEvent;
}) {
  return (
    <article className="flex items-center gap-2 px-5 py-1.5 text-[15px] leading-6">
      <CallPhoneIcon />
      <p className="min-w-0 flex-1">
        <span className="font-semibold text-zinc-900">{message.authorName}</span>
        <span className="text-zinc-500"> {chatCallActionLabel(event)}</span>
        <time className="ml-2 text-xs text-zinc-400">
          {formatChatClock(message.publishedAt)}
        </time>
      </p>
    </article>
  );
}

function CallPhoneIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-green-600">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M6.6 10.8c1.4 2.7 3.9 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .7-.2 1L6.6 10.8Z" />
      </svg>
    </span>
  );
}

