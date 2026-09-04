/** Contato da lista de DMs; isSecretary marca o atalho da secretária. */
export type ChatContact = {
  userId: number;
  name: string;
  username: string;
  imageUrl: string;
  subtitle: string;
  isOnline: boolean;
  conversationId: number | null;
  isSecretary: boolean;
};
