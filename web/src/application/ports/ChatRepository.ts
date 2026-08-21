import type { ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatContact } from "@/domain/ChatContact";
import type { ChatFile } from "@/domain/ChatFile";
import type { ChatMessage } from "@/domain/ChatMessage";
import type { ChatChannelType, Conversation } from "@/domain/Conversation";

export type ConversationLists = {
  channels: Conversation[];
  dms: Conversation[];
  pendingInvites: Conversation[];
  contacts: ChatContact[];
  spaceServerIds: number[];
};

export interface ChatRepository {
  listConversations(token: string): Promise<ConversationLists>;
  listMessages(token: string, conversationId: number): Promise<ChatMessage[]>;
  sendMessage(
    token: string,
    conversationId: number,
    content: string,
    files?: File[],
  ): Promise<ChatMessage>;
  getChatFile(token: string, fileId: number): Promise<ChatFile>;
  openDirectMessage(token: string, userId: number): Promise<Conversation>;
  createChannel(
    token: string,
    input: CreateChannelInput,
  ): Promise<Conversation>;
  enableSpaceServer(token: string, spaceId: number): Promise<void>;
  getChannelSettings(
    token: string,
    conversationId: number,
  ): Promise<ChannelSettings>;
  updateChannel(
    token: string,
    conversationId: number,
    input: UpdateChannelInput,
  ): Promise<Conversation>;
  deleteChannel(token: string, conversationId: number): Promise<void>;
  inviteChannelMember(
    token: string,
    conversationId: number,
    userId: number,
  ): Promise<void>;
  removeChannelMember(
    token: string,
    conversationId: number,
    userId: number,
  ): Promise<void>;
}

export type CreateChannelInput = {
  name: string;
  channelType: ChatChannelType;
  spaceId: number | null;
  isPrivate: boolean;
};

export type UpdateChannelInput = {
  name: string;
  topic: string;
  slowModeSeconds: number;
};
