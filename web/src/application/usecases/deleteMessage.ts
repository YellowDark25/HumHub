import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function deleteMessage(
  chat: ChatRepository,
  token: string,
  messageId: number,
) {
  if (!messageId) {
    throw new ApplicationError("Mensagem inválida.", 400);
  }

  return chat.deleteMessage(token, messageId);
}
