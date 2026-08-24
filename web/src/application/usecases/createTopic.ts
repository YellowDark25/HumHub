import { normalizeTopicName, TOPIC_MESSAGE_MAX } from "@/shared/chatTopic";
import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function createTopic(
  chat: ChatRepository,
  token: string,
  input: {
    conversationId: number;
    name: string;
    isPrivate: boolean;
    message: string;
  },
) {
  if (!input.conversationId) {
    throw new ApplicationError("Canal inválido.", 400);
  }

  const name = normalizeTopicName(input.name);
  if (!name) {
    throw new ApplicationError("Informe o nome do tópico.", 400);
  }

  const message = input.message.trim();
  if (message.length > TOPIC_MESSAGE_MAX) {
    throw new ApplicationError(
      `A mensagem pode ter no máximo ${TOPIC_MESSAGE_MAX} caracteres.`,
      400,
    );
  }

  return chat.createTopic(token, {
    conversationId: input.conversationId,
    name,
    isPrivate: Boolean(input.isPrivate),
    message,
  });
}
