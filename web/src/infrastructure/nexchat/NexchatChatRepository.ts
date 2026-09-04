import { ApplicationError } from "@/application/errors";
import type {
  ChatRepository,
  ConversationLists,
  CreateChannelInput,
  CreateTopicInput,
  UpdateChannelInput,
} from "@/application/ports/ChatRepository";
import type { ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatMember } from "@/domain/ChatMember";
import type { ChatFile } from "@/domain/ChatFile";
import type { ChatMutualServer } from "@/domain/ChatMutualServer";
import type {
  ChatLiveStream,
  ChatLiveSubscription,
} from "@/domain/ChatLive";
import type { VoiceLiveStream, VoiceLiveSubscription } from "@/domain/VoiceLive";
import type { VoiceOccupancyRoom } from "@/domain/VoiceRoom";
import type { ChatMessage, ChatReaction } from "@/domain/ChatMessage";
import { notificationLiveHubUrl } from "@/shared/notificationLive";
import { getHumhubUrl } from "../config";
import type {
  ChatNotificationPreference,
  ChatNotificationPreferencePatch,
} from "@/domain/ChatNotificationPreference";
import type { ChatTopic } from "@/domain/ChatTopic";
import type { Conversation } from "@/domain/Conversation";
import type { ConversationUnreadSnapshot } from "@/domain/ConversationUnread";
import { humhubRequest } from "../humhub/client";
import { nexchatFileRequest, nexchatRequest } from "./client";
import {
  mapChannelSettings,
  mapChatContact,
  mapChatMember,
  mapChatLiveSubscription,
  mapChatMutualServer,
  mapChatMessage,
  mapChatReaction,
  mapChatTopic,
  mapConversation,
  mapConversationUnreadSnapshot,
  mapServerNotificationPreference,
} from "./mappers";
import type {
  NexchatBootstrap,
  NexchatChannelMembersResult,
  NexchatChannelSettingsResult,
  NexchatCreateChannelResult,
  NexchatMutualServersResult,
  NexchatOpenDmResult,
  NexchatPoll,
  NexchatReaction,
  NexchatSendResult,
  NexchatServerNotificationPreference,
  NexchatSubscribeToken,
  NexchatTopic,
  NexchatUpdatesResult,
} from "./types";

export class NexchatChatRepository implements ChatRepository {
  async listConversations(token: string): Promise<ConversationLists> {
    const data = await nexchatRequest<NexchatBootstrap>({
      path: "bootstrap",
      token,
    });

    return {
      channels: (data.channels ?? []).map((item) =>
        mapConversation(item, "channel"),
      ),
      dms: (data.dms ?? []).map((item) => mapConversation(item, "dm")),
      pendingInvites: (data.pendingInvites ?? []).map((item) =>
        mapConversation(item, "invite"),
      ),
      contacts: (data.contacts ?? []).map(mapChatContact),
      spaceServerIds: data.spaceServerIds ?? [],
    };
  }

  async listConversationUpdates(
    token: string,
  ): Promise<ConversationUnreadSnapshot[]> {
    const data = await nexchatRequest<NexchatUpdatesResult>({
      path: "updates",
      token,
    });

    return (data.conversations ?? []).map(mapConversationUnreadSnapshot);
  }

  async listMutualServers(
    token: string,
    userId: number,
  ): Promise<ChatMutualServer[]> {
    const data = await nexchatRequest<NexchatMutualServersResult>({
      path: "mutual-servers",
      token,
      query: { userId },
    });

    return (data.servers ?? []).map(mapChatMutualServer);
  }

  async listMessages(
    token: string,
    conversationId: number,
    since = 0,
  ): Promise<ChatMessage[]> {
    const poll = await nexchatRequest<NexchatPoll>({
      path: "poll",
      token,
      query: { id: conversationId, since },
    });

    return (poll.messages ?? []).map(mapChatMessage);
  }

  async getLiveSubscription(
    token: string,
    conversationId: number,
  ): Promise<ChatLiveSubscription | null> {
    const dto = await nexchatRequest<NexchatSubscribeToken>({
      path: "subscribe-token",
      token,
      query: { id: conversationId },
    });

    return mapChatLiveSubscription(dto);
  }

  async openLiveStream(
    token: string,
    conversationId: number,
  ): Promise<ChatLiveStream | null> {
    return openMercureStream(
      await this.getLiveSubscription(token, conversationId),
      "Não foi possível abrir o canal do chat.",
    );
  }

  async getVoiceLiveSubscription(
    token: string,
  ): Promise<VoiceLiveSubscription | null> {
    const dto = await humhubRequest<NexchatSubscribeToken>({
      path: "/nexchat/voice-live",
      token,
      origin: "app",
    });

    return mapChatLiveSubscription(dto);
  }

  async openVoiceLiveStream(token: string): Promise<VoiceLiveStream | null> {
    return openMercureStream(
      await this.getVoiceLiveSubscription(token),
      "Não foi possível abrir o canal de voz.",
    );
  }

  async publishVoiceOccupancy(
    token: string,
    room: VoiceOccupancyRoom,
  ): Promise<void> {
    await humhubRequest({
      path: "/nexchat/voice-live/publish",
      token,
      method: "POST",
      origin: "app",
      body: {
        conversationId: room.conversationId,
        kind: room.kind,
        name: room.name,
        participants: room.participants,
      },
    });
  }

  async sendMessage(
    token: string,
    conversationId: number,
    content: string,
    files: File[] = [],
    replyToId = 0,
  ): Promise<ChatMessage> {
    const result = await nexchatRequest<NexchatSendResult>({
      path: "send",
      token,
      method: "POST",
      body: sendBody(conversationId, content, files, replyToId),
    });

    if (!result.message) {
      throw new ApplicationError("Não foi possível enviar a mensagem.", 502);
    }

    return mapChatMessage(result.message);
  }

  async editMessage(
    token: string,
    messageId: number,
    content: string,
  ): Promise<ChatMessage> {
    const result = await nexchatRequest<NexchatSendResult>({
      path: "edit",
      token,
      method: "POST",
      body: { message_id: messageId, content },
    });

    if (!result.success || !result.message) {
      throw new ApplicationError(
        result.error || "Não foi possível atualizar a mensagem.",
        400,
      );
    }

    return mapChatMessage(result.message);
  }

  async deleteMessage(token: string, messageId: number): Promise<ChatMessage> {
    const result = await nexchatRequest<NexchatSendResult>({
      path: "delete",
      token,
      method: "POST",
      body: { message_id: messageId },
    });

    if (!result.success || !result.message) {
      throw new ApplicationError(
        result.error || "Não foi possível excluir a mensagem.",
        400,
      );
    }

    return mapChatMessage(result.message);
  }

  async reactToMessage(
    token: string,
    messageId: number,
    emoji: string,
  ): Promise<{ messageId: number; reactions: ChatReaction[] }> {
    const result = await nexchatRequest<{
      success: boolean;
      error?: string;
      messageId?: number;
      reactions?: NexchatReaction[];
    }>({
      path: "react",
      token,
      method: "POST",
      body: { message_id: messageId, emoji },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível reagir à mensagem.",
        400,
      );
    }

    return {
      messageId: result.messageId ?? messageId,
      reactions: (result.reactions ?? []).map(mapChatReaction),
    };
  }

  async forwardMessage(
    token: string,
    messageId: number,
    conversationIds: number[],
    comment: string,
  ): Promise<ChatMessage[]> {
    const result = await nexchatRequest<{
      success: boolean;
      error?: string;
      messages?: NexchatSendResult["message"][];
    }>({
      path: "forward",
      token,
      method: "POST",
      body: { message_id: messageId, conversation_ids: conversationIds, comment },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível encaminhar a mensagem.",
        400,
      );
    }

    return (result.messages ?? []).flatMap((message) =>
      message ? [mapChatMessage(message)] : [],
    );
  }

  async sendTyping(
    token: string,
    conversationId: number,
    isTyping: boolean,
  ): Promise<void> {
    const result = await nexchatRequest<{ success: boolean; error?: string }>({
      path: "typing",
      token,
      method: "POST",
      body: { conversation_id: conversationId, is_typing: isTyping },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível avisar que você está digitando.",
        400,
      );
    }
  }

  async getChatFile(token: string, fileId: number): Promise<ChatFile> {
    return nexchatFileRequest({ token, fileId });
  }

  async openDirectMessage(token: string, userId: number): Promise<Conversation> {
    const result = await nexchatRequest<NexchatOpenDmResult>({
      path: "open-dm",
      token,
      method: "POST",
      body: { user_id: userId },
    });

    if (!result.success || !result.conversation) {
      throw new ApplicationError(
        result.error || "Não foi possível abrir a conversa.",
        400,
      );
    }

    return mapConversation(result.conversation, "dm");
  }

  /**
   * Abre o fio de sistema da secretária, sem outro usuário HumHub.
   */
  async openSecretaryConversation(token: string): Promise<Conversation> {
    const result = await nexchatRequest<NexchatOpenDmResult>({
      path: "open-secretary",
      token,
      method: "POST",
    });

    if (!result.success || !result.conversation) {
      throw new ApplicationError(
        result.error || "Não foi possível abrir a secretária.",
        400,
      );
    }

    return mapConversation(result.conversation, "dm");
  }

  async createChannel(
    token: string,
    input: CreateChannelInput,
  ): Promise<Conversation> {
    const result = await nexchatRequest<NexchatCreateChannelResult>({
      path: "create-channel",
      token,
      method: "POST",
      body: {
        name: input.name,
        channel_kind: input.channelType,
        space_id: input.spaceId ?? 0,
        is_private: input.isPrivate,
      },
    });

    if (!result.success || !result.conversation) {
      throw new ApplicationError(
        result.error || "Não foi possível criar o canal.",
        400,
      );
    }

    return mapConversation(result.conversation, "channel");
  }

  async enableSpaceServer(token: string, spaceId: number): Promise<void> {
    const result = await nexchatRequest<{ success: boolean; error?: string }>({
      path: "enable-space-server",
      token,
      method: "POST",
      body: { space_id: spaceId },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível criar o servidor do chat.",
        400,
      );
    }
  }

  async getChannelSettings(
    token: string,
    conversationId: number,
  ): Promise<ChannelSettings> {
    const result = await nexchatRequest<NexchatChannelSettingsResult>({
      path: "channel-settings",
      token,
      query: { id: conversationId },
    });

    if (!result.success || !result.conversation) {
      throw new ApplicationError(
        result.error || "Não foi possível carregar o canal.",
        400,
      );
    }

    return mapChannelSettings({
      conversation: result.conversation,
      members: result.members,
      pendingInvites: result.pendingInvites,
      invitableUsers: result.invitableUsers,
    });
  }

  /**
   * Busca o roster do canal no Nexchat.
   * Chama GET channel-members, mapeia cada pessoa e descarta id inválido.
   */
  async listChannelMembers(
    token: string,
    conversationId: number,
  ): Promise<ChatMember[]> {
    const result = await nexchatRequest<NexchatChannelMembersResult>({
      path: "channel-members",
      token,
      query: { id: conversationId },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível carregar os membros.",
        400,
      );
    }

    return (result.members ?? [])
      .map(mapChatMember)
      .filter((member) => member.userId > 0);
  }

  async updateChannel(
    token: string,
    conversationId: number,
    input: UpdateChannelInput,
  ): Promise<Conversation> {
    const result = await nexchatRequest<NexchatChannelSettingsResult>({
      path: "update-channel",
      token,
      method: "POST",
      body: {
        conversation_id: conversationId,
        name: input.name,
        topic: input.topic,
        slow_mode_seconds: input.slowModeSeconds,
      },
    });

    if (!result.success || !result.conversation) {
      throw new ApplicationError(
        result.error || "Não foi possível salvar o canal.",
        400,
      );
    }

    return mapConversation(result.conversation, "channel");
  }

  async deleteChannel(token: string, conversationId: number): Promise<void> {
    const result = await nexchatRequest<{ success: boolean; error?: string }>({
      path: "delete-channel",
      token,
      method: "POST",
      body: { conversation_id: conversationId },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível excluir o canal.",
        400,
      );
    }
  }

  async inviteChannelMember(
    token: string,
    conversationId: number,
    userId: number,
  ): Promise<void> {
    const result = await nexchatRequest<{ success: boolean; error?: string }>({
      path: "invite-member",
      token,
      method: "POST",
      body: { conversation_id: conversationId, user_id: userId },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível convidar o usuário.",
        400,
      );
    }
  }

  async removeChannelMember(
    token: string,
    conversationId: number,
    userId: number,
  ): Promise<void> {
    const result = await nexchatRequest<{ success: boolean; error?: string }>({
      path: "remove-member",
      token,
      method: "POST",
      body: { conversation_id: conversationId, user_id: userId },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível remover o membro.",
        400,
      );
    }
  }

  async getServerNotificationPreference(
    token: string,
    spaceId: number,
  ): Promise<ChatNotificationPreference> {
    const result = await nexchatRequest<NexchatServerNotificationPreference>({
      path: "notification-preference",
      token,
      query: { space_id: spaceId },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível carregar as preferências.",
        400,
      );
    }

    return mapServerNotificationPreference(result, spaceId);
  }

  async saveServerNotificationPreference(
    token: string,
    patch: ChatNotificationPreferencePatch,
  ): Promise<ChatNotificationPreference> {
    const result = await nexchatRequest<NexchatServerNotificationPreference>({
      path: "save-notification-preference",
      token,
      method: "POST",
      body: {
        spaceId: patch.spaceId,
        level: patch.level,
        muteDuration: patch.muteDuration,
      },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível salvar as preferências.",
        400,
      );
    }

    return mapServerNotificationPreference(result, patch.spaceId);
  }

  async listTopics(token: string, conversationId: number): Promise<ChatTopic[]> {
    const result = await nexchatRequest<{
      success: boolean;
      error?: string;
      topics?: NexchatTopic[];
    }>({
      path: "list-topics",
      token,
      query: { conversation_id: conversationId },
    });

    if (!result.success) {
      throw new ApplicationError(
        result.error || "Não foi possível carregar os tópicos.",
        400,
      );
    }

    return (result.topics ?? []).map(mapChatTopic);
  }

  async createTopic(
    token: string,
    input: CreateTopicInput,
  ): Promise<Conversation> {
    const result = await nexchatRequest<NexchatCreateChannelResult>({
      path: "create-topic",
      token,
      method: "POST",
      body: {
        conversation_id: input.conversationId,
        name: input.name,
        is_private: input.isPrivate,
        message: input.message,
      },
    });

    if (!result.success || !result.conversation) {
      throw new ApplicationError(
        result.error || "Não foi possível criar o tópico.",
        400,
      );
    }

    return mapConversation(result.conversation, "channel");
  }
}

async function openMercureStream(
  subscription: ChatLiveSubscription | null,
  fallback: string,
): Promise<ChatLiveStream | null> {
  if (!subscription) {
    return null;
  }

  const response = await fetch(internalMercureUrl(subscription), {
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${subscription.token}`,
    },
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    throw new ApplicationError(
      fallback,
      response.status === 404 ? 404 : 502,
    );
  }

  return {
    body: response.body,
    contentType: response.headers.get("content-type") ?? "text/event-stream",
  };
}

function internalMercureUrl(subscription: ChatLiveSubscription): string {
  const publicHub = new URL(notificationLiveHubUrl(subscription));
  const internal = new URL(getHumhubUrl());
  publicHub.protocol = internal.protocol;
  publicHub.host = internal.host;
  return publicHub.toString();
}

function sendBody(
  conversationId: number,
  content: string,
  files: File[],
  replyToId: number,
) {
  if (files.length === 0) {
    return {
      conversation_id: conversationId,
      content,
      reply_to_id: replyToId || undefined,
    };
  }

  const form = new FormData();
  form.append("conversation_id", String(conversationId));
  form.append("content", content);
  if (replyToId) {
    form.append("reply_to_id", String(replyToId));
  }
  for (const file of files) {
    form.append("files[]", file, file.name);
  }

  return form;
}
