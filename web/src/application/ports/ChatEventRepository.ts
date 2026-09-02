import type { ChatEvent, ChatEventList, CreateChatEventInput } from "@/domain/ChatEvent";
import type { ChatFile } from "@/domain/ChatFile";

/**
 * Porta dos eventos do servidor de chat.
 * Lista os próximos, cria, marca interesse e baixa a imagem de apresentação.
 */
export interface ChatEventRepository {
  listSpaceEvents(token: string, spaceId: number): Promise<ChatEventList>;
  createSpaceEvent(token: string, input: CreateChatEventInput): Promise<ChatEvent>;
  toggleSpaceEventInterest(token: string, eventId: number): Promise<ChatEvent>;
  getSpaceEventImage(token: string, eventId: number): Promise<ChatFile>;
}
