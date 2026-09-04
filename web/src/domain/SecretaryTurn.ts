/** Pedido que o HumHub manda ao Next quando a secretária precisa responder. */
export type SecretaryTurnInput = {
  conversationId: number;
  messageId: number;
  userId: number;
  content: string;
  audioFileId: number | null;
};

/** Mensagem resumida do histórico da DM da secretária. */
export type SecretaryHistoryMessage = {
  id: number;
  authorId: number;
  content: string;
  isSecretary: boolean;
  audioFileId: number | null;
  publishedAt: string | null;
};
