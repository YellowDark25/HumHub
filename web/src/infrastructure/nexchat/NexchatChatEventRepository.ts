import { ApplicationError } from "@/application/errors";
import type { ChatEventRepository } from "@/application/ports/ChatEventRepository";
import type { ChatEvent, ChatEventList, CreateChatEventInput } from "@/domain/ChatEvent";
import type { ChatFile } from "@/domain/ChatFile";
import { getHumhubUrl } from "../config";
import { humhubRequest } from "../humhub/client";
import { mapChatEvent, mapChatEventList } from "./mappers";
import type { NexchatSpaceEventListResult } from "./types";

/**
 * Eventos do servidor via Nexchat.
 * Lista, cria e baixa a imagem no módulo PHP.
 */
export class NexchatChatEventRepository implements ChatEventRepository {
  /**
   * Lista os eventos futuros do espaço.
   * Chama GET /nexchat/event e mapeia a lista.
   */
  async listSpaceEvents(
    token: string,
    spaceId: number,
  ): Promise<ChatEventList> {
    const dto = await humhubRequest<NexchatSpaceEventListResult>({
      path: `/nexchat/event?spaceId=${spaceId}`,
      token,
      origin: "app",
    });
    assertEventOk(dto);

    return mapChatEventList(dto);
  }

  /**
   * Cria o evento no espaço.
   * Envia FormData para POST /nexchat/event/create, inclusive a imagem.
   */
  async createSpaceEvent(
    token: string,
    input: CreateChatEventInput,
  ): Promise<ChatEvent> {
    const body = new FormData();
    body.append("spaceId", String(input.spaceId));
    body.append("title", input.title);
    body.append("description", input.description);
    body.append("locationKind", input.locationKind);
    body.append("frequency", input.frequency);
    body.append("startsAt", input.startsAt);
    if (input.conversationId) {
      body.append("conversationId", String(input.conversationId));
    }
    if (input.locationText) {
      body.append("locationText", input.locationText);
    }
    if (input.image) {
      body.append("image", input.image);
    }

    const dto = await humhubRequest<NexchatSpaceEventListResult>({
      path: "/nexchat/event/create",
      token,
      origin: "app",
      method: "POST",
      body,
    });
    assertEventOk(dto);
    if (!dto.event) {
      throw new ApplicationError("Não foi possível criar o evento.", 502);
    }

    return mapChatEvent(dto.event);
  }

  /**
   * Alterna o interesse no evento.
   * POST /nexchat/event/interest e devolve o evento mapeado.
   */
  async toggleSpaceEventInterest(
    token: string,
    eventId: number,
  ): Promise<ChatEvent> {
    const dto = await humhubRequest<NexchatSpaceEventListResult>({
      path: "/nexchat/event/interest",
      token,
      origin: "app",
      method: "POST",
      body: { eventId },
    });
    assertEventOk(dto);
    if (!dto.event) {
      throw new ApplicationError("Não foi possível atualizar o interesse.", 502);
    }

    return mapChatEvent(dto.event);
  }

  /**
   * Baixa o binário da imagem de apresentação.
   * Chama GET /nexchat/event/image com o id do evento.
   */
  async getSpaceEventImage(
    token: string,
    eventId: number,
  ): Promise<ChatFile> {
    const response = await fetch(
      `${getHumhubUrl()}/nexchat/event/image?id=${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      throw new ApplicationError(
        "Não foi possível abrir a imagem do evento.",
        response.status,
      );
    }

    const disposition = response.headers.get("content-disposition") ?? "";
    const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);

    return {
      body: await response.arrayBuffer(),
      contentType:
        response.headers.get("content-type") || "application/octet-stream",
      fileName: fileNameMatch?.[1] ?? "evento",
    };
  }
}

/**
 * Converte resposta sem success em ApplicationError.
 * Lê message/error do Nexchat.
 */
function assertEventOk(dto: NexchatSpaceEventListResult) {
  if (dto.success === false) {
    throw new ApplicationError(
      dto.message || dto.error || "Não foi possível atualizar os eventos.",
      400,
    );
  }
}
