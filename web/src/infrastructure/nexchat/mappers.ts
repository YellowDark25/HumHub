import type { ChannelMember, ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatAttachment } from "@/domain/ChatAttachment";
import type { ChatContact } from "@/domain/ChatContact";
import type { ChatMessage } from "@/domain/ChatMessage";
import type {
  ChatChannelType,
  Conversation,
  ConversationKind,
} from "@/domain/Conversation";
import { getPublicHumhubUrl } from "../config";
import { PROFILE_IMAGE_FOLDER } from "../humhub/constants";
import type {
  NexchatAttachment,
  NexchatContact,
  NexchatConversation,
  NexchatMessage,
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
  const trimmed = guid?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  return `${getPublicHumhubUrl()}/${PROFILE_IMAGE_FOLDER}/${trimmed}.jpg`;
}

export function mapChatMessage(dto: NexchatMessage): ChatMessage {
  return {
    id: dto.id,
    authorId: dto.userId ?? 0,
    authorName: dto.authorName,
    authorImageUrl: publicImageUrl(dto.avatarUrl),
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

function isAudioName(name: string): boolean {
  return /\.(webm|ogg|mp3|wav|m4a)$/i.test(name);
}

function publicImageUrl(imageUrl?: string): string {
  const trimmed = imageUrl?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `${getPublicHumhubUrl()}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }

  try {
    const parsed = new URL(trimmed);
    return `${getPublicHumhubUrl()}${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
}
