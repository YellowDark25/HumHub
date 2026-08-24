import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function listMessages(
  chat: ChatRepository,
  token: string,
  conversationId: number,
  since = 0,
) {
  if (!conversationId) {
    throw new ApplicationError("Conversa inválida.", 400);
  }

  return chat.listMessages(token, conversationId, since);
}
