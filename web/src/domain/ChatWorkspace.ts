import type { ChatChannelType } from "./Conversation";

export const HOME_WORKSPACE_ID = "home";
export const CHANNELS_WORKSPACE_ID = "canais";

export type ChatWorkspaceKind = "home" | "space" | "channels";

export type ChatWorkspace = {
  id: string;
  kind: ChatWorkspaceKind;
  name: string;
  imageUrl: string;
  spaceId: number | null;
};

export type ChatSidebarItemKind = "channel" | "dm" | "invite" | "contact";

export type ChatSidebarItem = {
  key: string;
  name: string;
  username: string;
  kind: ChatSidebarItemKind;
  conversationId: number | null;
  parentConversationId: number | null;
  userId: number | null;
  children: ChatSidebarItem[];
  imageUrl: string;
  subtitle: string;
  isOnline: boolean;
  channelType: ChatChannelType | null;
  canManage: boolean;
  isSecretary?: boolean;
};

export type ChatSidebarSection = {
  title: string;
  items: ChatSidebarItem[];
  createChannelType?: ChatChannelType | null;
};
