import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function listTopics(
  chat: ChatRepository,
  token: string,
  conversationId: number,
) {
  if (!conversationId) {
    throw new ApplicationError("Canal inválido.", 400);
  }

  return chat.listTopics(token, conversationId);
}
