import type { ChatMessage } from "@/domain/ChatMessage";
import type { Conversation, ConversationKind } from "@/domain/Conversation";
import type { NexchatConversation, NexchatMessage } from "./types";

export function mapConversation(
  dto: NexchatConversation,
  kind: ConversationKind,
): Conversation {
  return {
    id: dto.id,
    kind,
    name: dto.name,
  };
}

export function mapChatMessage(dto: NexchatMessage): ChatMessage {
  return {
    id: dto.id,
    authorName: dto.authorName,
    content: dto.content,
    publishedAt: dto.createdAt ?? null,
    isDeleted: Boolean(dto.deleted),
  };
}
