import type { CreateChatEventInput } from "@/domain/ChatEvent";
import {
  EVENT_DESCRIPTION_MAX,
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_TYPES,
  EVENT_LOCATION_MAX,
  EVENT_TITLE_MAX,
  isChatEventFrequency,
  isChatEventLocationKind,
} from "@/shared/chatEvent";
import { parseDate } from "@/shared/format";
import { ApplicationError } from "../errors";
import type { ChatEventRepository } from "../ports/ChatEventRepository";

/**
 * Cria um evento no servidor.
 * Valida assunto, local, data futura e imagem opcional; grava pela porta.
 */
export function createSpaceEvent(
  events: ChatEventRepository,
  token: string,
  input: CreateChatEventInput,
) {
  if (!input.spaceId) {
    throw new ApplicationError("Servidor inválido.", 400);
  }

  const title = input.title.trim();
  if (!title) {
    throw new ApplicationError("Informe o assunto do evento.", 400);
  }

  if (title.length > EVENT_TITLE_MAX) {
    throw new ApplicationError("O assunto do evento é longo demais.", 400);
  }

  if (!isChatEventLocationKind(input.locationKind)) {
    throw new ApplicationError("Informe onde o evento acontece.", 400);
  }

  if (input.locationKind === "voice" && !input.conversationId) {
    throw new ApplicationError("Selecione um canal de voz.", 400);
  }

  const locationText = input.locationText.trim();
  if (input.locationKind === "elsewhere") {
    if (!locationText) {
      throw new ApplicationError("Informe a localização do evento.", 400);
    }
    if (locationText.length > EVENT_LOCATION_MAX) {
      throw new ApplicationError("A localização é longa demais.", 400);
    }
  }

  const startsAt = input.startsAt.trim();
  const startDate = parseDate(startsAt);
  if (!startDate) {
    throw new ApplicationError("Informe a data e a hora de início.", 400);
  }

  if (startDate.getTime() < Date.now() - 60_000) {
    throw new ApplicationError("A data de início precisa ser no futuro.", 400);
  }

  if (!isChatEventFrequency(input.frequency)) {
    throw new ApplicationError("Frequência inválida.", 400);
  }

  const description = input.description.trim();
  if (description.length > EVENT_DESCRIPTION_MAX) {
    throw new ApplicationError("A descrição é longa demais.", 400);
  }

  assertEventImage(input.image);

  return events.createSpaceEvent(token, {
    ...input,
    title,
    description,
    locationText,
    startsAt,
    image: input.image,
  });
}

/**
 * Recusa imagem fora do tipo ou do tamanho aceitos.
 * Sem arquivo, não faz nada.
 */
function assertEventImage(image: File | null) {
  if (!image) {
    return;
  }

  if (!EVENT_IMAGE_TYPES.includes(image.type)) {
    throw new ApplicationError("Envie uma imagem JPG, PNG, GIF ou WebP.", 400);
  }

  if (image.size > EVENT_IMAGE_MAX_BYTES) {
    throw new ApplicationError("A imagem pode ter no máximo 5 MB.", 400);
  }
}
