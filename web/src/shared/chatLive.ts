import type { ChatAttachment } from "@/domain/ChatAttachment";
import type { ChatLiveEvent } from "@/domain/ChatLive";
import type { ChatMessage, ChatReaction, ChatReplyPreview } from "@/domain/ChatMessage";
import { reactionsForUser } from "@/domain/ChatMessage";

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

  if (payload.type === "nexchat.reaction") {
    const messageId = Number(payload.messageId);
    if (!Number.isFinite(messageId) || messageId <= 0) {
      return null;
    }

    return {
      type: "reaction",
      conversationId,
      messageId,
      reactions: Array.isArray(payload.reactions)
        ? payload.reactions.flatMap(readLiveReaction)
        : [],
    };
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
  currentUserId = 0,
): ChatMessage[] {
  if (event.type === "typing") {
    return messages;
  }

  if (event.type === "reaction") {
    return messages.map((item) =>
      item.id === event.messageId
        ? { ...item, reactions: reactionsForUser(event.reactions, currentUserId) }
        : item,
    );
  }

  if (event.type === "newMessage" || event.type === "editMessage") {
    return upsertChatMessage(messages, withUserReactions(event.message, currentUserId));
  }

  if (event.message) {
    return upsertChatMessage(messages, withUserReactions(event.message, currentUserId));
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
    editedAt: typeof payload.editedAt === "string" ? payload.editedAt : null,
    isDeleted: payload.deleted === true,
    attachments,
    reactions: Array.isArray(payload.reactions)
      ? payload.reactions.flatMap(readLiveReaction)
      : [],
    replyTo: readLiveReply(payload.replyTo),
  };
}

function readLiveReaction(payload: unknown): ChatReaction[] {
  if (!isRecord(payload) || typeof payload.emoji !== "string" || !payload.emoji) {
    return [];
  }

  return [
    {
      emoji: payload.emoji,
      count: typeof payload.count === "number" ? payload.count : 0,
      isMine: payload.mine === true,
      users: Array.isArray(payload.users)
        ? payload.users.filter((name): name is string => typeof name === "string")
        : [],
      userIds: Array.isArray(payload.userIds)
        ? payload.userIds.filter((id): id is number => typeof id === "number")
        : [],
    },
  ];
}

function readLiveReply(payload: unknown): ChatReplyPreview | null {
  if (!isRecord(payload) || typeof payload.id !== "number" || !payload.id) {
    return null;
  }

  return {
    id: payload.id,
    authorName:
      typeof payload.authorName === "string" && payload.authorName.trim()
        ? payload.authorName
        : "Usuário",
    preview: typeof payload.preview === "string" ? payload.preview : "",
  };
}

function withUserReactions(message: ChatMessage, currentUserId: number): ChatMessage {
  return {
    ...message,
    reactions: reactionsForUser(message.reactions, currentUserId),
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
    editedAt: null,
    isDeleted: true,
    attachments: [],
    reactions: [],
    replyTo: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
