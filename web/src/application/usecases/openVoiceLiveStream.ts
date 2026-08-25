import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function openVoiceLiveStream(chat: ChatRepository, token: string) {
  if (!token) {
    throw new ApplicationError("Não autenticado.", 401);
  }

  return chat.openVoiceLiveStream(token);
}
