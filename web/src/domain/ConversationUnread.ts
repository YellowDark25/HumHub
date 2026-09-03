export const UNREAD_BADGE_MAX = 99;

/**
 * Instantâneo de atividade de uma conversa para calcular não lidas.
 * Vem do bootstrap/updates: último id e total de mensagens.
 */
export type ConversationUnreadSnapshot = {
  conversationId: number;
  lastMessageId: number;
  messageCount: number;
};

/**
 * Quantas mensagens ainda não foram vistas nesta conversa.
 * Se o último id já foi marcado, devolve 0. Com total conhecido, usa
 * messageCount − seenCount; senão, pelo menos 1 quando há id novo.
 */
export function unreadCountOf(input: {
  lastMessageId: number;
  messageCount: number;
  seenMessageId: number;
  seenCount: number;
}): number {
  if (input.lastMessageId <= input.seenMessageId) {
    return 0;
  }

  if (input.messageCount > 0) {
    return Math.max(1, input.messageCount - input.seenCount);
  }

  return 1;
}

/**
 * Texto do badge vermelho (1–99, depois 99+).
 * @param count quantidade de não lidas; 0 não deve ser exibido.
 */
export function formatUnreadBadge(count: number): string {
  if (count > UNREAD_BADGE_MAX) {
    return `${UNREAD_BADGE_MAX}+`;
  }

  return String(Math.max(0, count));
}
