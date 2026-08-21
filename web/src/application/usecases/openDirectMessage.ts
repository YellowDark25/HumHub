import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function openDirectMessage(
  chat: ChatRepository,
  token: string,
  userId: number,
) {
  if (!userId) {
    throw new ApplicationError("Usuário inválido.", 400);
  }

  return chat.openDirectMessage(token, userId);
}
