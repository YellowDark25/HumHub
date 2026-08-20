import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function sendMessage(
  chat: ChatRepository,
  token: string,
  conversationId: number,
  content: string,
) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new ApplicationError("A mensagem não pode ficar vazia.", 400);
  }

  if (!conversationId) {
    throw new ApplicationError("Conversa inválida.", 400);
  }

  return chat.sendMessage(token, conversationId, trimmed);
}
