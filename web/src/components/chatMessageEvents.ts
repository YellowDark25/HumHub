import type { ChatMessage } from "@/domain/ChatMessage";

type ChatMessageListener = (conversationId: number, message: ChatMessage) => void;

const listeners = new Set<ChatMessageListener>();

export function publishChatMessage(conversationId: number, message: ChatMessage) {
  listeners.forEach((listener) => listener(conversationId, message));
}

export function subscribeChatMessages(listener: ChatMessageListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
