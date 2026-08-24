import type { ChatAttachment } from "@/domain/ChatAttachment";
import type { ChatLiveEvent } from "@/domain/ChatLive";
import type { ChatMessage } from "@/domain/ChatMessage";

export const CHAT_LIVE_POLL_MS = 4_000;
export const CHAT_LIVE_RECONNECT_MS = 2_000;

export function readChatLiveEvent(
  payload: unknown,
  conversationId: number,
): ChatLiveEvent | null {
  if (!isRecord(payload) || typeof payload.type !== "string") {
    return null;
  }

  const eventConversationId = Number(payload.conversationId);
  if (eventConversationId !== conversationId) {
    return null;
  }

  if (payload.type === "nexchat.newMessage") {
    const message = readLiveMessage(payload.message);
    return message
      ? { type: "newMessage", conversationId, message }
      : null;
  }

  if (payload.type === "nexchat.editMessage") {
    const message = readLiveMessage(payload.message);
    return message
      ? { type: "editMessage", conversationId, message }
      : null;
  }

  if (payload.type === "nexchat.typing") {
    const userId = Number(payload.userId);
    const userName =
      typeof payload.userName === "string" && payload.userName.trim()
        ? payload.userName.trim()
        : "Alguém";
    if (!Number.isFinite(userId) || userId <= 0) {
      return null;
    }

    return {
      type: "typing",
      conversationId,
      userId,
      userName,
      isTyping: payload.isTyping === true,
    };
  }

  if (payload.type === "nexchat.deleteMessage") {
    const messageId = Number(payload.messageId);
    if (!Number.isFinite(messageId) || messageId <= 0) {
      return null;
    }

    return {
      type: "deleteMessage",
      conversationId,
      messageId,
      message: readLiveMessage(payload.message),
    };
  }

  return null;
}

export function applyChatLiveEvent(
  messages: ChatMessage[],
  event: ChatLiveEvent,
): ChatMessage[] {
  if (event.type === "typing") {
    return messages;
  }

  if (event.type === "newMessage" || event.type === "editMessage") {
    return upsertChatMessage(messages, event.message);
  }

  if (event.message) {
    return upsertChatMessage(messages, event.message);
  }

  return messages.map((item) =>
    item.id === event.messageId ? deletedMessage(item) : item,
  );
}

export function upsertChatMessage(
  messages: ChatMessage[],
  incoming: ChatMessage,
): ChatMessage[] {
  if (messages.some((item) => item.id === incoming.id)) {
    return messages.map((item) => (item.id === incoming.id ? incoming : item));
  }

  return [...messages, incoming].sort((left, right) => left.id - right.id);
}

export function lastChatMessageId(messages: ChatMessage[]): number {
  return messages.reduce((max, message) => Math.max(max, message.id), 0);
}

function readLiveMessage(payload: unknown): ChatMessage | null {
  if (!isRecord(payload) || typeof payload.id !== "number" || !payload.id) {
    return null;
  }

  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments.flatMap(readLiveAttachment)
    : [];

  return {
    id: payload.id,
    authorId: typeof payload.userId === "number" ? payload.userId : 0,
    authorName:
      typeof payload.authorName === "string" && payload.authorName.trim()
        ? payload.authorName
        : "Usuário",
    authorImageUrl: liveMediaUrl(
      typeof payload.avatarUrl === "string" ? payload.avatarUrl : "",
    ),
    content: typeof payload.content === "string" ? payload.content : "",
    publishedAt:
      typeof payload.createdAt === "string" ? payload.createdAt : null,
    isDeleted: payload.deleted === true,
    attachments,
  };
}

function readLiveAttachment(payload: unknown): ChatAttachment[] {
  if (!isRecord(payload) || typeof payload.id !== "number" || !payload.id) {
    return [];
  }

  const name = typeof payload.name === "string" ? payload.name : "arquivo";
  const mime = typeof payload.mime === "string" ? payload.mime : "";

  return [
    {
      id: payload.id,
      name,
      url: `/api/chat/files/${payload.id}`,
      mime,
      isImage: payload.isImage === true,
      isAudio: mime.startsWith("audio/") || /\.(webm|ogg|mp3|wav|m4a)$/i.test(name),
    },
  ];
}

function liveMediaUrl(imageUrl: string): string {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return "";
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `/api/media${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }

  try {
    const parsed = new URL(trimmed);
    return `/api/media${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
}

function deletedMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    content: "",
    isDeleted: true,
    attachments: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
