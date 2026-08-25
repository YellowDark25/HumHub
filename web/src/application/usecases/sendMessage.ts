import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function sendMessage(
  chat: ChatRepository,
  token: string,
  conversationId: number,
  content: string,
  files: File[] = [],
  replyToId = 0,
) {
  const trimmed = content.trim();
  if (!trimmed && files.length === 0) {
    throw new ApplicationError("A mensagem não pode ficar vazia.", 400);
  }

  if (!conversationId) {
    throw new ApplicationError("Conversa inválida.", 400);
  }

  return chat.sendMessage(token, conversationId, trimmed, files, replyToId);
}
