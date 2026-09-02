/** Onde o evento acontece: canal de voz do servidor ou outro lugar. */
export type ChatEventLocationKind = "voice" | "elsewhere";

/** Frequência de repetição do evento no servidor. */
export type ChatEventFrequency = "none" | "weekly" | "monthly";

/**
 * Evento agendado de um servidor de chat.
 * Guarda assunto, local, horário e metadados de quem criou.
 */
export type ChatEvent = {
  id: number;
  spaceId: number;
  title: string;
  description: string;
  locationKind: ChatEventLocationKind;
  conversationId: number | null;
  conversationName: string;
  locationText: string;
  startsAt: string;
  frequency: ChatEventFrequency;
  imageUrl: string;
  creatorName: string;
  creatorImageUrl: string;
  interestedCount: number;
  isInterested: boolean;
  canEdit: boolean;
};

/**
 * Lista de eventos futuros e se o usuário autenticado pode criar.
 */
export type ChatEventList = {
  events: ChatEvent[];
  canCreate: boolean;
};

/**
 * Canal de voz oferecido no assistente de criação.
 */
export type ChatEventChannelOption = {
  id: number;
  name: string;
};

/**
 * Dados para criar um evento no servidor.
 * Imagem é opcional e vai no upload multipart.
 */
export type CreateChatEventInput = {
  spaceId: number;
  title: string;
  description: string;
  locationKind: ChatEventLocationKind;
  conversationId: number | null;
  locationText: string;
  startsAt: string;
  frequency: ChatEventFrequency;
  image: File | null;
};
