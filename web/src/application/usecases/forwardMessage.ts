import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

const MAX_FORWARD_TARGETS = 10;

export function forwardMessage(
  chat: ChatRepository,
  token: string,
  input: {
    messageId: number;
    conversationIds: number[];
    userIds?: number[];
    comment?: string;
  },
) {
  if (!input.messageId) {
    throw new ApplicationError("Mensagem inválida.", 400);
  }

  const conversationIds = uniquePositive(input.conversationIds);
  const userIds = uniquePositive(input.userIds ?? []);
  if (conversationIds.length === 0 && userIds.length === 0) {
    throw new ApplicationError("Selecione pelo menos um destino.", 400);
  }

  if (conversationIds.length + userIds.length > MAX_FORWARD_TARGETS) {
    throw new ApplicationError(
      `Você pode encaminhar para no máximo ${MAX_FORWARD_TARGETS} destinos.`,
      400,
    );
  }

  return sendForwarded(chat, token, input.messageId, conversationIds, userIds, input.comment ?? "");
}

async function sendForwarded(
  chat: ChatRepository,
  token: string,
  messageId: number,
  conversationIds: number[],
  userIds: number[],
  comment: string,
) {
  const opened = await Promise.all(
    userIds.map((userId) => chat.openDirectMessage(token, userId)),
  );
  const targets = uniquePositive([
    ...conversationIds,
    ...opened.map((conversation) => conversation.id),
  ]);

  return chat.forwardMessage(token, messageId, targets, comment.trim());
}

function uniquePositive(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value) && value > 0))];
}
