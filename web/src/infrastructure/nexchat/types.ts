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
  lastMessageId?: number;
  messageCount?: number;
};

export type NexchatConversationUpdate = {
  id: number;
  lastMessageId?: number;
  messageCount?: number;
};

export type NexchatUpdatesResult = {
  success: boolean;
  conversations?: NexchatConversationUpdate[];
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
  title?: string;
  isAdmin?: boolean;
  isOnline?: boolean;
};

export type NexchatChannelMembersResult = {
  success: boolean;
  error?: string;
  members?: NexchatChannelPerson[];
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

export type NexchatReaction = {
  emoji: string;
  count?: number;
  mine?: boolean;
  users?: string[];
  userIds?: number[];
};

export type NexchatReplyTo = {
  id: number;
  authorName?: string;
  preview?: string;
};

export type NexchatMessage = {
  id: number;
  userId?: number;
  authorName: string;
  avatarUrl?: string;
  content: string;
  createdAt?: string;
  editedAt?: string | null;
  deleted?: boolean;
  attachments?: NexchatAttachment[];
  reactions?: NexchatReaction[];
  replyTo?: NexchatReplyTo | null;
};

export type NexchatContact = {
  id: number;
  name: string;
  username?: string;
  guid?: string;
  title?: string;
  lastPreview?: string;
  isOnline?: boolean;
  conversationId?: number | null;
};

export type NexchatMutualServer = {
  id: number;
  name: string;
  guid?: string;
};

export type NexchatMutualServersResult = {
  success: boolean;
  servers?: NexchatMutualServer[];
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
  available?: boolean;
  hubUrl?: string;
  topic?: string;
  topics?: string[];
  jwt?: string;
  error?: string;
};

export type NexchatSendResult = {
  success: boolean;
  error?: string;
  message?: NexchatMessage;
};

export type NexchatDriveFolder = {
  id: number;
  name: string;
  parentId?: number;
  authorName?: string;
  avatarUrl?: string;
  createdAt?: string | null;
  canDelete?: boolean;
};

export type NexchatDriveFile = {
  id: number;
  folderId?: number;
  origin?: string;
  name: string;
  mime?: string;
  sizeBytes?: number;
  isImage?: boolean;
  isAudio?: boolean;
  description?: string;
  authorName?: string;
  avatarUrl?: string;
  publishedAt?: string | null;
  canDelete?: boolean;
  spaceId?: number;
};

export type NexchatDriveResult = {
  success?: boolean;
  message?: string;
  error?: string;
  folderId?: number;
  folderName?: string;
  ancestors?: { id: number; name: string }[];
  folders?: NexchatDriveFolder[];
  files?: NexchatDriveFile[];
  folder?: NexchatDriveFolder;
};

export type NexchatServerNotificationPreference = {
  success: boolean;
  error?: string;
  spaceId?: number;
  level?: string;
  mutedUntil?: string | null;
  isMuted?: boolean;
};

export type NexchatSpaceEvent = {
  id: number;
  spaceId?: number;
  title?: string;
  description?: string;
  locationKind?: string;
  conversationId?: number | null;
  conversationName?: string;
  locationText?: string;
  startsAt?: string;
  frequency?: string;
  hasImage?: boolean;
  creatorName?: string;
  creatorImageUrl?: string;
  interestedCount?: number;
  isInterested?: boolean;
  canEdit?: boolean;
};

export type NexchatSpaceEventListResult = {
  success?: boolean;
  message?: string;
  error?: string;
  canCreate?: boolean;
  events?: NexchatSpaceEvent[];
  event?: NexchatSpaceEvent;
};
