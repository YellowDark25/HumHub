import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

/**
 * Lista os membros do canal com presença (online/offline).
 * Valida o id e pede o roster ao repositório; tópico resolve para o canal pai no HumHub.
 */
export function listChannelMembers(
  chat: ChatRepository,
  token: string,
  conversationId: number,
) {
  if (!conversationId) {
    throw new ApplicationError("Canal inválido.", 400);
  }

  return chat.listChannelMembers(token, conversationId);
}
