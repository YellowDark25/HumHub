import { ApplicationError } from "../errors";
import type { ChatEventRepository } from "../ports/ChatEventRepository";

/**
 * Alterna o interesse do usuário autenticado no evento.
 * Recusa id inválido e devolve o evento atualizado pela porta.
 */
export function toggleSpaceEventInterest(
  events: ChatEventRepository,
  token: string,
  eventId: number,
) {
  if (!eventId) {
    throw new ApplicationError("Evento inválido.", 400);
  }

  return events.toggleSpaceEventInterest(token, eventId);
}
