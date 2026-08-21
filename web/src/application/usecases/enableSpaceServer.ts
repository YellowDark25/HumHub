import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function enableSpaceServer(
  chat: ChatRepository,
  token: string,
  spaceId: number,
) {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  return chat.enableSpaceServer(token, spaceId);
}
