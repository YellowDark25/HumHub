export type NexchatConversation = {
  id: number;
  type: string;
  name: string;
  spaceId?: number | null;
  channelKind?: string | null;
  isPrivate?: boolean;
  topic?: string;
  slowModeSeconds?: number;
  parentId?: number | null;
  isAdmin?: boolean;
};

export type NexchatTopic = {
  id: number;
  parentConversationId: number;
  name: string;
  isPrivate?: boolean;
  lastPreview?: string;
  lastActivityAt?: string | null;
  messageCount?: number;
  starterName?: string;
  starterImageUrl?: string;
  isJoined?: boolean;
};

export type NexchatChannelPerson = {
  userId: number;
  name: string;
  username?: string;
  guid?: string;
  isAdmin?: boolean;
};

export type NexchatChannelSettingsResult = {
  success: boolean;
  error?: string;
  conversation?: NexchatConversation;
  members?: NexchatChannelPerson[];
  pendingInvites?: NexchatChannelPerson[];
  invitableUsers?: NexchatChannelPerson[];
};

export type NexchatAttachment = {
  id: number;
  name: string;
  url?: string;
  mime?: string;
  isImage?: boolean;
};

export type NexchatMessage = {
  id: number;
  userId?: number;
  authorName: string;
  avatarUrl?: string;
  content: string;
  createdAt?: string;
  deleted?: boolean;
  attachments?: NexchatAttachment[];
};

export type NexchatContact = {
  id: number;
  name: string;
  guid?: string;
  title?: string;
  lastPreview?: string;
  isOnline?: boolean;
  conversationId?: number | null;
};

export type NexchatBootstrap = {
  success: boolean;
  channels: NexchatConversation[];
  dms: NexchatConversation[];
  pendingInvites: NexchatConversation[];
  contacts?: NexchatContact[];
  spaceServerIds?: number[];
};

export type NexchatOpenDmResult = {
  success: boolean;
  error?: string;
  conversation?: NexchatConversation;
};

export type NexchatCreateChannelResult = {
  success: boolean;
  error?: string;
  conversation?: NexchatConversation;
};

export type NexchatPoll = {
  success: boolean;
  messages: NexchatMessage[];
};

export type NexchatSubscribeToken = {
  success?: boolean;
  hubUrl?: string;
  topic?: string;
  topics?: string[];
  jwt?: string;
  error?: string;
};

export type NexchatSendResult = {
  success: boolean;
  message?: NexchatMessage;
};

export type NexchatServerNotificationPreference = {
  success: boolean;
  error?: string;
  spaceId?: number;
  level?: string;
  mutedUntil?: string | null;
  isMuted?: boolean;
};
