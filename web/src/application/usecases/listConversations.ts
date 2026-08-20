import type { ChatRepository } from "../ports/ChatRepository";

export function listConversations(chat: ChatRepository, token: string) {
  return chat.listConversations(token);
}
