export type NexchatConversation = {
  id: number;
  type: string;
  name: string;
};

export type NexchatMessage = {
  id: number;
  userId: number;
  authorName: string;
  content: string;
  createdAt?: string;
  deleted?: boolean;
};

export type NexchatBootstrap = {
  success: boolean;
  channels: NexchatConversation[];
  dms: NexchatConversation[];
  pendingInvites: NexchatConversation[];
};

export type NexchatPoll = {
  success: boolean;
  messages: NexchatMessage[];
};

export type NexchatSendResult = {
  success: boolean;
  message?: NexchatMessage;
};
