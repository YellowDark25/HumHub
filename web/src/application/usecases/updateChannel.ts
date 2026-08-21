import { CHANNEL_TOPIC_MAX, normalizeChannelName } from "@/shared/chatChannel";
import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function updateChannel(
  chat: ChatRepository,
  token: string,
  conversationId: number,
  input: { name: string; topic: string; slowModeSeconds: number },
) {
  if (!conversationId) {
    throw new ApplicationError("Canal inválido.", 400);
  }

  const name = normalizeChannelName(input.name);
  if (!name) {
    throw new ApplicationError("Informe o nome do canal.", 400);
  }

  const topic = input.topic.trim();
  if (topic.length > CHANNEL_TOPIC_MAX) {
    throw new ApplicationError(
      `O assunto do canal pode ter no máximo ${CHANNEL_TOPIC_MAX} caracteres.`,
      400,
    );
  }

  if (input.slowModeSeconds < 0) {
    throw new ApplicationError("Modo lento inválido.", 400);
  }

  return chat.updateChannel(token, conversationId, {
    name,
    topic,
    slowModeSeconds: input.slowModeSeconds,
  });
}
