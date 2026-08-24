import { ApplicationError } from "@/application/errors";
import type {
  ChatRepository,
  ConversationLists,
  CreateChannelInput,
  UpdateChannelInput,
} from "@/application/ports/ChatRepository";
import type { ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatFile } from "@/domain/ChatFile";
import type {
  ChatLiveStream,
  ChatLiveSubscription,
} from "@/domain/ChatLive";
import type { ChatMessage } from "@/domain/ChatMessage";
import { notificationLiveHubUrl } from "@/shared/notificationLive";
import { getHumhubUrl } from "../config";
import type {
  ChatNotificationPreference,
  ChatNotificationPreferencePatch,
} from "@/domain/ChatNotificationPreference";
import type { Conversation } from "@/domain/Conversation";
import { nexchatFileRequest, nexchatRequest } from "./client";
import {
  mapChannelSettings,
  mapChatContact,
  mapChatLiveSubscription,
  mapChatMessage,
  mapConversation,
  mapServerNotificationPreference,
} from "./mappers";
import type {
  NexchatBootstrap,
  NexchatChannelSettingsResult,
  NexchatCreateChannelResult,
  NexchatOpenDmResult,
  NexchatPoll,
  NexchatSendResult,
  NexchatServerNotificationPreference,
  NexchatSubscribeToken,
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
    const subscription = await this.getLiveSubscription(token, conversationId);
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
        "Não foi possível abrir o canal do chat.",
        response.status === 404 ? 404 : 502,
      );
    }

    return {
      body: response.body,
      contentType:
        response.headers.get("content-type") ?? "text/event-stream",
    };
  }

  async sendMessage(
    token: string,
    conversationId: number,
    content: string,
    files: File[] = [],
  ): Promise<ChatMessage> {
    const result = await nexchatRequest<NexchatSendResult>({
      path: "send",
      token,
      method: "POST",
      body: sendBody(conversationId, content, files),
    });

    if (!result.message) {
      throw new ApplicationError("Não foi possível enviar a mensagem.", 502);
    }

    return mapChatMessage(result.message);
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
}

function internalMercureUrl(subscription: ChatLiveSubscription): string {
  const publicHub = new URL(notificationLiveHubUrl(subscription));
  const internal = new URL(getHumhubUrl());
  publicHub.protocol = internal.protocol;
  publicHub.host = internal.host;
  return publicHub.toString();
}

function sendBody(conversationId: number, content: string, files: File[]) {
  if (files.length === 0) {
    return { conversation_id: conversationId, content };
  }

  const form = new FormData();
  form.append("conversation_id", String(conversationId));
  form.append("content", content);
  for (const file of files) {
    form.append("files[]", file, file.name);
  }

  return form;
}
