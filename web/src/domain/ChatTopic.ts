export type ChatTopic = {
  id: number;
  parentConversationId: number;
  name: string;
  isPrivate: boolean;
  lastPreview: string;
  lastActivityAt: string | null;
  messageCount: number;
  starterName: string;
  starterImageUrl: string;
  isJoined: boolean;
};
