import type { ChatAttachment } from "./ChatAttachment";

export const MESSAGE_EDIT_WINDOW_MS = 60 * 60 * 1000;

export type ChatReaction = {
  emoji: string;
  count: number;
  isMine: boolean;
  users: string[];
  userIds: number[];
};

export function reactionsForUser(
  reactions: ChatReaction[],
  currentUserId: number,
): ChatReaction[] {
  return reactions.map((reaction) => ({
    ...reaction,
    isMine: reaction.isMine || reaction.userIds.includes(currentUserId),
  }));
}

export type ChatReplyPreview = {
  id: number;
  authorName: string;
  preview: string;
};

export type ChatMessage = {
  id: number;
  authorId: number;
  authorName: string;
  authorImageUrl: string;
  content: string;
  publishedAt: string | null;
  editedAt: string | null;
  isDeleted: boolean;
  attachments: ChatAttachment[];
  reactions: ChatReaction[];
  replyTo: ChatReplyPreview | null;
};

export function canEditChatMessage(
  message: ChatMessage,
  currentUserId: number,
  now = Date.now(),
): boolean {
  if (message.isDeleted || message.authorId !== currentUserId) {
    return false;
  }

  const publishedAt = parsePublishedAt(message.publishedAt);
  if (publishedAt === null) {
    return false;
  }

  return now - publishedAt <= MESSAGE_EDIT_WINDOW_MS;
}

export function canDeleteChatMessage(
  message: ChatMessage,
  currentUserId: number,
  canManage: boolean,
): boolean {
  if (message.isDeleted) {
    return false;
  }

  return message.authorId === currentUserId || canManage;
}

export function isEditedChatMessage(message: ChatMessage): boolean {
  return Boolean(message.editedAt) && !message.isDeleted;
}

function parsePublishedAt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(parsed) ? null : parsed;
}
