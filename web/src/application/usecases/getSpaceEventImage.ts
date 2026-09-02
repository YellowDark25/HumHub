import { ApplicationError } from "../errors";
import type { ChatEventRepository } from "../ports/ChatEventRepository";

/**
 * Baixa a imagem de apresentação do evento.
 * Recusa id inválido e devolve o binário pela porta.
 */
export function getSpaceEventImage(
  events: ChatEventRepository,
  token: string,
  eventId: number,
) {
  if (!eventId) {
    throw new ApplicationError("Evento inválido.", 400);
  }

  return events.getSpaceEventImage(token, eventId);
}
