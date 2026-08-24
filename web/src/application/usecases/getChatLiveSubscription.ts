import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function getChatLiveSubscription(
  chat: ChatRepository,
  token: string,
  conversationId: number,
) {
  if (!token) {
    throw new ApplicationError("Não autenticado.", 401);
  }

  if (!conversationId) {
    throw new ApplicationError("Conversa inválida.", 400);
  }

  return chat.getLiveSubscription(token, conversationId);
}
