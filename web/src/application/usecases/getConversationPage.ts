import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export async function getConversationPage(
  chat: ChatRepository,
  token: string,
  conversationId: number,
) {
  if (!conversationId) {
    throw new ApplicationError("Conversa inválida.", 404);
  }

  const [lists, messages] = await Promise.all([
    chat.listConversations(token),
    chat.listMessages(token, conversationId),
  ]);

  const current = [...lists.channels, ...lists.dms, ...lists.pendingInvites].find(
    (item) => item.id === conversationId,
  );

  if (!current) {
    throw new ApplicationError("Conversa não encontrada.", 404);
  }

  return { current, lists, messages };
}
