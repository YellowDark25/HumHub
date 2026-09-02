import { ApplicationError } from "../errors";
import type { ChatEventRepository } from "../ports/ChatEventRepository";

/**
 * Lista os eventos futuros do servidor.
 * Recusa spaceId inválido e devolve a lista com a flag de criação.
 */
export function listSpaceEvents(
  events: ChatEventRepository,
  token: string,
  spaceId: number,
) {
  if (!spaceId) {
    throw new ApplicationError("Servidor inválido.", 400);
  }

  return events.listSpaceEvents(token, spaceId);
}
