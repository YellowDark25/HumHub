import type { ChannelMember, ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatAttachment } from "@/domain/ChatAttachment";
import type { ChatContact } from "@/domain/ChatContact";
import type { ChatLiveSubscription } from "@/domain/ChatLive";
import type { ChatMessage } from "@/domain/ChatMessage";
import type {
  ChatNotificationLevel,
  ChatNotificationPreference,
} from "@/domain/ChatNotificationPreference";
import type {
  ChatChannelType,
  Conversation,
  ConversationKind,
} from "@/domain/Conversation";
import { isChatNotificationLevel } from "@/shared/chatNotification";
import { mediaUrlFromGuid, toBrowserMediaUrl } from "../humhub/publicMediaUrl";
import type {
  NexchatAttachment,
  NexchatContact,
  NexchatConversation,
  NexchatMessage,
  NexchatServerNotificationPreference,
  NexchatSubscribeToken,
} from "./types";

export function mapConversation(
  dto: NexchatConversation,
  kind: ConversationKind,
): Conversation {
  return {
    id: dto.id,
    kind,
    name: dto.name,
    spaceId: dto.spaceId ?? null,
    channelType: kind === "channel" ? readChannelType(dto.channelKind) : null,
    isPrivate: Boolean(dto.isPrivate),
    topic: dto.topic ?? "",
    slowModeSeconds: dto.slowModeSeconds ?? 0,
    canManage: Boolean(dto.isAdmin),
  };
}

export function mapChannelSettings(dto: {
  conversation: NexchatConversation;
  members?: { userId: number; name: string; isAdmin?: boolean }[];
  pendingInvites?: { userId: number; name: string; isAdmin?: boolean }[];
  invitableUsers?: {
    userId: number;
    name: string;
    username?: string;
    guid?: string;
  }[];
}): ChannelSettings {
  return {
    conversation: mapConversation(dto.conversation, "channel"),
    members: (dto.members ?? []).map(mapChannelMember),
    pendingInvites: (dto.pendingInvites ?? []).map(mapChannelMember),
    invitableUsers: (dto.invitableUsers ?? []).map((person) => ({
      userId: person.userId,
      name: person.name,
      username: person.username ?? "",
      imageUrl: contactImageUrl(person.guid),
    })),
  };
}

function mapChannelMember(person: {
  userId: number;
  name: string;
  isAdmin?: boolean;
}): ChannelMember {
  return {
    userId: person.userId,
    name: person.name,
    isAdmin: Boolean(person.isAdmin),
  };
}

function readChannelType(value?: string | null): ChatChannelType {
  if (value === "voice" || value === "forum") {
    return value;
  }

  return "text";
}

export function mapChatContact(dto: NexchatContact): ChatContact {
  return {
    userId: dto.id,
    name: dto.name,
    imageUrl: contactImageUrl(dto.guid),
    subtitle: dto.lastPreview?.trim() || dto.title?.trim() || "",
    isOnline: Boolean(dto.isOnline),
    conversationId: dto.conversationId ?? null,
  };
}

function contactImageUrl(guid?: string): string {
  return mediaUrlFromGuid(guid ?? "");
}

export function mapChatLiveSubscription(
  dto: NexchatSubscribeToken,
): ChatLiveSubscription | null {
  const hubUrl = dto.hubUrl?.trim() ?? "";
  const topic = dto.topic?.trim() || dto.topics?.[0]?.trim() || "";
  const token = dto.jwt?.trim() ?? "";
  if (!hubUrl || !topic || !token) {
    return null;
  }

  return { hubUrl, topic, token };
}

export function mapChatMessage(dto: NexchatMessage): ChatMessage {
  return {
    id: dto.id,
    authorId: dto.userId ?? 0,
    authorName: dto.authorName,
    authorImageUrl: toBrowserMediaUrl(dto.avatarUrl),
    content: dto.content,
    publishedAt: dto.createdAt ?? null,
    isDeleted: Boolean(dto.deleted),
    attachments: (dto.attachments ?? []).map(mapChatAttachment),
  };
}

function mapChatAttachment(dto: NexchatAttachment): ChatAttachment {
  const mime = dto.mime ?? "";

  return {
    id: dto.id,
    name: dto.name,
    url: `/api/chat/files/${dto.id}`,
    mime,
    isImage: Boolean(dto.isImage),
    isAudio: mime.startsWith("audio/") || isAudioName(dto.name),
  };
}

export function mapServerNotificationPreference(
  dto: NexchatServerNotificationPreference,
  spaceId: number,
): ChatNotificationPreference {
  return {
    spaceId: dto.spaceId ?? spaceId,
    level: readNotificationLevel(dto.level),
    mutedUntil: dto.mutedUntil ?? null,
    isMuted: Boolean(dto.isMuted),
  };
}

function readNotificationLevel(value?: string): ChatNotificationLevel {
  return isChatNotificationLevel(value) ? value : "mentions";
}

function isAudioName(name: string): boolean {
  return /\.(webm|ogg|mp3|wav|m4a)$/i.test(name);
}

