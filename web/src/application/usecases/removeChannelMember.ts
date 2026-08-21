import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function removeChannelMember(
  chat: ChatRepository,
  token: string,
  conversationId: number,
  userId: number,
) {
  if (!conversationId) {
    throw new ApplicationError("Canal inválido.", 400);
  }

  if (!userId) {
    throw new ApplicationError("Usuário inválido.", 400);
  }

  return chat.removeChannelMember(token, conversationId, userId);
}
