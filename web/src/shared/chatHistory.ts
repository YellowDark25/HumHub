import { readChatCallEvent } from "@/domain/ChatCallEvent";
import type { ChatMessage } from "@/domain/ChatMessage";
import { formatChatDayHeading, parseDate } from "./format";

const GROUP_GAP_MS = 7 * 60 * 1000;

export type ChatHistoryDay = {
  type: "day";
  key: string;
  label: string;
};

export type ChatHistoryGroup = {
  type: "group";
  key: string;
  authorId: number;
  authorName: string;
  authorImageUrl: string;
  publishedAt: string | null;
  messages: ChatMessage[];
};

export type ChatHistoryItem = ChatHistoryDay | ChatHistoryGroup;

export function groupChatHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  const items: ChatHistoryItem[] = [];
  let currentGroup: ChatHistoryGroup | null = null;
  let lastDayKey = "";

  for (const message of messages) {
    const dayKey = calendarDayKey(message.publishedAt);
    if (dayKey && dayKey !== lastDayKey) {
      currentGroup = null;
      lastDayKey = dayKey;
      items.push({
        type: "day",
        key: `day-${dayKey}`,
        label: formatChatDayHeading(message.publishedAt),
      });
    }

    if (currentGroup && canJoinGroup(currentGroup, message)) {
      currentGroup.messages.push(message);
      continue;
    }

    currentGroup = {
      type: "group",
      key: `group-${message.id}`,
      authorId: message.authorId,
      authorName: message.authorName,
      authorImageUrl: message.authorImageUrl,
      publishedAt: message.publishedAt,
      messages: [message],
    };
    items.push(currentGroup);
  }

  return items;
}

function canJoinGroup(group: ChatHistoryGroup, message: ChatMessage): boolean {
  if (readChatCallEvent(message.content) || message.replyTo) {
    return false;
  }

  const previous = group.messages[group.messages.length - 1];
  if (previous && readChatCallEvent(previous.content)) {
    return false;
  }

  if (group.authorId !== message.authorId) {
    return false;
  }

  const previousTime = parseDate(previous?.publishedAt)?.getTime();
  const nextTime = parseDate(message.publishedAt)?.getTime();
  if (previousTime === undefined || nextTime === undefined) {
    return true;
  }

  return nextTime - previousTime <= GROUP_GAP_MS;
}

function calendarDayKey(value: string | null): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
