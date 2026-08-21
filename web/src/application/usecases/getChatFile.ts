import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function getChatFile(
  chat: ChatRepository,
  token: string,
  fileId: number,
) {
  if (!fileId) {
    throw new ApplicationError("Arquivo inválido.", 400);
  }

  return chat.getChatFile(token, fileId);
}
