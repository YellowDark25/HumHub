import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function getChannelSettings(
  chat: ChatRepository,
  token: string,
  conversationId: number,
) {
  if (!conversationId) {
    throw new ApplicationError("Canal inválido.", 400);
  }

  return chat.getChannelSettings(token, conversationId);
}
