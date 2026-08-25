import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function editMessage(
  chat: ChatRepository,
  token: string,
  messageId: number,
  content: string,
) {
  const trimmed = content.trim();
  if (!messageId) {
    throw new ApplicationError("Mensagem inválida.", 400);
  }

  if (!trimmed) {
    throw new ApplicationError("A mensagem não pode ficar vazia.", 400);
  }

  return chat.editMessage(token, messageId, trimmed);
}
