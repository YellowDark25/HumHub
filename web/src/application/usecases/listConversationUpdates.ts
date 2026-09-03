import type { ChatRepository } from "../ports/ChatRepository";

/**
 * Lista o último id e o total de mensagens de cada conversa do usuário.
 * Encaminha à porta; a UI compara com o visto local para montar os badges.
 */
export function listConversationUpdates(chat: ChatRepository, token: string) {
  return chat.listConversationUpdates(token);
}
