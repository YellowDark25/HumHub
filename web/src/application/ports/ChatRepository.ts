import type { ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatContact } from "@/domain/ChatContact";
import type { ChatMutualServer } from "@/domain/ChatMutualServer";
import type { ChatFile } from "@/domain/ChatFile";
import type {
  ChatLiveStream,
  ChatLiveSubscription,
} from "@/domain/ChatLive";
import type { VoiceLiveStream, VoiceLiveSubscription } from "@/domain/VoiceLive";
import type { VoiceOccupancyRoom } from "@/domain/VoiceRoom";
import type { ChatMessage, ChatReaction } from "@/domain/ChatMessage";
import type {
  ChatNotificationPreference,
  ChatNotificationPreferencePatch,
} from "@/domain/ChatNotificationPreference";
import type { ChatTopic } from "@/domain/ChatTopic";
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
  listMutualServers(token: string, userId: number): Promise<ChatMutualServer[]>;
  listMessages(
    token: string,
    conversationId: number,
    since?: number,
  ): Promise<ChatMessage[]>;
  getLiveSubscription(
    token: string,
    conversationId: number,
  ): Promise<ChatLiveSubscription | null>;
  openLiveStream(
    token: string,
    conversationId: number,
  ): Promise<ChatLiveStream | null>;
  getVoiceLiveSubscription(token: string): Promise<VoiceLiveSubscription | null>;
  openVoiceLiveStream(token: string): Promise<VoiceLiveStream | null>;
  publishVoiceOccupancy(token: string, room: VoiceOccupancyRoom): Promise<void>;
  sendMessage(
    token: string,
    conversationId: number,
    content: string,
    files?: File[],
    replyToId?: number,
  ): Promise<ChatMessage>;
  editMessage(
    token: string,
    messageId: number,
    content: string,
  ): Promise<ChatMessage>;
  deleteMessage(token: string, messageId: number): Promise<ChatMessage>;
  reactToMessage(
    token: string,
    messageId: number,
    emoji: string,
  ): Promise<{ messageId: number; reactions: ChatReaction[] }>;
  forwardMessage(
    token: string,
    messageId: number,
    conversationIds: number[],
    comment: string,
  ): Promise<ChatMessage[]>;
  sendTyping(
    token: string,
    conversationId: number,
    isTyping: boolean,
  ): Promise<void>;
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
  getServerNotificationPreference(
    token: string,
    spaceId: number,
  ): Promise<ChatNotificationPreference>;
  saveServerNotificationPreference(
    token: string,
    patch: ChatNotificationPreferencePatch,
  ): Promise<ChatNotificationPreference>;
  listTopics(token: string, conversationId: number): Promise<ChatTopic[]>;
  createTopic(token: string, input: CreateTopicInput): Promise<Conversation>;
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

export type CreateTopicInput = {
  conversationId: number;
  name: string;
  isPrivate: boolean;
  message: string;
};
