import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function getServerNotificationPreference(
  chat: ChatRepository,
  token: string,
  spaceId: number,
) {
  if (!Number.isFinite(spaceId) || spaceId < 0) {
    throw new ApplicationError("Servidor inválido.", 400);
  }

  return chat.getServerNotificationPreference(token, Math.trunc(spaceId));
}
