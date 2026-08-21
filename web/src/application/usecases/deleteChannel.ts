import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function deleteChannel(
  chat: ChatRepository,
  token: string,
  conversationId: number,
) {
  if (!conversationId) {
    throw new ApplicationError("Canal inválido.", 400);
  }

  return chat.deleteChannel(token, conversationId);
}
