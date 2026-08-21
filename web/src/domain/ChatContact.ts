export type ChatContact = {
  userId: number;
  name: string;
  imageUrl: string;
  subtitle: string;
  isOnline: boolean;
  conversationId: number | null;
};
