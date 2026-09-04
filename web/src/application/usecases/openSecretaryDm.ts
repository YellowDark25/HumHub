import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

/**
 * Abre ou cria a DM com a secretária configurada.
 * Não aceita userId do cliente — usa só o id da conta Kaizzen.
 */
export function openSecretaryDm(
  chat: ChatRepository,
  token: string,
  secretaryUserId: number,
) {
  if (!secretaryUserId) {
    throw new ApplicationError("A secretária ainda não está configurada.", 503);
  }

  return chat.openDirectMessage(token, secretaryUserId);
}
