import type { Conversation } from "@/domain/Conversation";

export const TOPIC_NAME_MAX = 100;
export const TOPIC_MESSAGE_MAX = 2000;

export function normalizeTopicName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, TOPIC_NAME_MAX);
}

export function isChatTopic(conversation: Pick<Conversation, "parentConversationId">) {
  return (conversation.parentConversationId ?? 0) > 0;
}

export function topicParentId(conversation: Pick<Conversation, "id" | "parentConversationId">) {
  return conversation.parentConversationId && conversation.parentConversationId > 0
    ? conversation.parentConversationId
    : conversation.id;
}
