import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

const MAX_EMOJI_LENGTH = 16;

export function reactToMessage(
  chat: ChatRepository,
  token: string,
  messageId: number,
  emoji: string,
) {
  const trimmed = emoji.trim();
  if (!messageId) {
    throw new ApplicationError("Mensagem inválida.", 400);
  }

  if (!trimmed || trimmed.length > MAX_EMOJI_LENGTH) {
    throw new ApplicationError("Emoji inválido.", 400);
  }

  return chat.reactToMessage(token, messageId, trimmed);
}
