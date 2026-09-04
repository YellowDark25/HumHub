import type { ChatRepository } from "../ports/ChatRepository";

/**
 * Abre ou cria o fio de sistema da secretária do usuário autenticado.
 * Não usa outro usuário HumHub — a conversa só tem o dono.
 */
export function openSecretaryDm(chat: ChatRepository, token: string) {
  return chat.openSecretaryConversation(token);
}
