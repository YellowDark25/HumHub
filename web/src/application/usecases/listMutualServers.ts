import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function listMutualServers(
  chat: ChatRepository,
  token: string,
  userId: number,
) {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ApplicationError("Pessoa inválida.", 400);
  }

  return chat.listMutualServers(token, userId);
}
