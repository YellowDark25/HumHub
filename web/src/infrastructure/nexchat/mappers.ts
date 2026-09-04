import { chatCallPreview } from "@/domain/ChatCallEvent";
import type {
  SpaceDrive,
  SpaceDriveAncestor,
  SpaceFolder,
} from "@/domain/SpaceDrive";
import { SPACE_DRIVE_ROOT_ID, asDriveList } from "@/domain/SpaceDrive";
import type { SpaceFile } from "@/domain/SpaceFile";
import type { ChannelMember, ChannelSettings } from "@/domain/ChannelSettings";
import type { ChatMember } from "@/domain/ChatMember";
import type { ChatAttachment } from "@/domain/ChatAttachment";
import type { ChatContact } from "@/domain/ChatContact";
import type { ChatMutualServer } from "@/domain/ChatMutualServer";
import type { ChatLiveSubscription } from "@/domain/ChatLive";
import type { ChatMessage, ChatReaction, ChatReplyPreview } from "@/domain/ChatMessage";
import type {
  ChatNotificationLevel,
  ChatNotificationPreference,
} from "@/domain/ChatNotificationPreference";
import type {
  ChatEvent,
  ChatEventFrequency,
  ChatEventList,
  ChatEventLocationKind,
} from "@/domain/ChatEvent";
import type { ChatTopic } from "@/domain/ChatTopic";
import type {
  ChatChannelType,
  Conversation,
  ConversationKind,
} from "@/domain/Conversation";
import type { ConversationUnreadSnapshot } from "@/domain/ConversationUnread";
import { isChatNotificationLevel } from "@/shared/chatNotification";
import { mediaUrlFromGuid, toBrowserMediaUrl } from "../humhub/publicMediaUrl";
import type {
  NexchatAttachment,
  NexchatContact,
  NexchatConversation,
  NexchatMessage,
  NexchatReaction,
  NexchatReplyTo,
  NexchatServerNotificationPreference,
  NexchatSubscribeToken,
  NexchatDriveFile,
  NexchatDriveFolder,
  NexchatDriveResult,
  NexchatSpaceEvent,
  NexchatSpaceEventListResult,
  NexchatConversationUpdate,
  NexchatTopic,
} from "./types";

/**
 * Converte o DTO Nexchat na conversa da intranet.
 * Copia canal, espaço e o instantâneo de mensagens para o badge de não lidas.
 */
export function mapConversation(
  dto: NexchatConversation,
  kind: ConversationKind,
): Conversation {
  return {
    id: dto.id,
    kind,
    name: dto.name,
    spaceId: dto.spaceId ?? null,
    parentConversationId: dto.parentId ?? null,
    channelType: kind === "channel" ? readChannelType(dto.channelKind) : null,
    isPrivate: Boolean(dto.isPrivate),
    topic: dto.topic ?? "",
    slowModeSeconds: dto.slowModeSeconds ?? 0,
    canManage: Boolean(dto.isAdmin),
    lastMessageId: dto.lastMessageId ?? 0,
    messageCount: dto.messageCount ?? 0,
  };
}

/**
 * Converte o item de /updates no instantâneo de não lidas.
 * Copia último id e total; ids inválidos viram 0.
 */
export function mapConversationUnreadSnapshot(
  dto: NexchatConversationUpdate,
): ConversationUnreadSnapshot {
  return {
    conversationId: dto.id,
    lastMessageId: dto.lastMessageId ?? 0,
    messageCount: dto.messageCount ?? 0,
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

/**
 * Converte o DTO do roster Nexchat no membro da intranet.
 * Copia nome, cargo e presença; monta a foto a partir do guid do HumHub.
 */
export function mapChatMember(person: {
  userId: number;
  name: string;
  username?: string;
  guid?: string;
  title?: string;
  isAdmin?: boolean;
  isOnline?: boolean;
}): ChatMember {
  return {
    userId: person.userId,
    name: person.name,
    username: person.username ?? "",
    imageUrl: contactImageUrl(person.guid),
    title: person.title?.trim() ?? "",
    isAdmin: Boolean(person.isAdmin),
    isOnline: Boolean(person.isOnline),
  };
}

export function mapChatTopic(dto: NexchatTopic): ChatTopic {
  return {
    id: dto.id,
    parentConversationId: dto.parentConversationId,
    name: dto.name,
    isPrivate: Boolean(dto.isPrivate),
    lastPreview: dto.lastPreview ?? "",
    lastActivityAt: dto.lastActivityAt ?? null,
    messageCount: dto.messageCount ?? 0,
    starterName: dto.starterName ?? "",
    starterImageUrl: toBrowserMediaUrl(dto.starterImageUrl ?? ""),
    isJoined: Boolean(dto.isJoined),
  };
}

function readChannelType(value?: string | null): ChatChannelType {
  if (value === "voice" || value === "forum") {
    return value;
  }

  return "text";
}

export function mapChatMutualServer(dto: {
  id: number;
  name: string;
  guid?: string;
}): ChatMutualServer {
  return {
    id: dto.id,
    name: dto.name,
    imageUrl: contactImageUrl(dto.guid),
  };
}

export function mapChatContact(dto: NexchatContact): ChatContact {
  return {
    userId: dto.id,
    name: dto.name,
    username: dto.username?.trim() ?? "",
    imageUrl: contactImageUrl(dto.guid),
    subtitle:
      chatCallPreview(dto.lastPreview ?? "") ||
      dto.lastPreview?.trim() ||
      dto.title?.trim() ||
      "",
    isOnline: Boolean(dto.isOnline),
    conversationId: dto.conversationId ?? null,
    isSecretary: Boolean(dto.isSecretary),
  };
}

function contactImageUrl(guid?: string): string {
  return mediaUrlFromGuid(guid ?? "");
}

export function mapChatLiveSubscription(
  dto: NexchatSubscribeToken,
): ChatLiveSubscription | null {
  if (dto.available === false) {
    return null;
  }

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
    editedAt: dto.editedAt ?? null,
    isDeleted: Boolean(dto.deleted),
    attachments: (dto.attachments ?? []).map(mapChatAttachment),
    reactions: (dto.reactions ?? []).map(mapChatReaction),
    replyTo: mapChatReply(dto.replyTo),
  };
}

export function mapChatReaction(dto: NexchatReaction): ChatReaction {
  return {
    emoji: dto.emoji,
    count: dto.count ?? 0,
    isMine: Boolean(dto.mine),
    users: dto.users ?? [],
    userIds: dto.userIds ?? [],
  };
}

function mapChatReply(dto?: NexchatReplyTo | null): ChatReplyPreview | null {
  if (!dto?.id) {
    return null;
  }

  return {
    id: dto.id,
    authorName: dto.authorName?.trim() || "Usuário",
    preview: dto.preview ?? "",
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

/**
 * Converte o DTO da pasta aberta no drive da intranet.
 * Copia caminho, subpastas e arquivos; a URL de download aponta para a API Next.
 */
export function mapSpaceDrive(dto: NexchatDriveResult, spaceId: number): SpaceDrive {
  return {
    folderId: dto.folderId ?? SPACE_DRIVE_ROOT_ID,
    folderName: dto.folderName?.trim() || "Arquivos",
    ancestors: asDriveList(dto.ancestors).map(mapDriveAncestor),
    folders: asDriveList(dto.folders).map(mapSpaceFolder),
    files: asDriveList(dto.files).map((file) => mapSpaceDriveFile(file, spaceId)),
  };
}

/**
 * Converte uma pasta do Nexchat no type do domínio.
 * Copia nome, dono e a URL do avatar para o proxy da intranet.
 */
export function mapSpaceFolder(dto: NexchatDriveFolder): SpaceFolder {
  return {
    id: dto.id,
    name: dto.name,
    parentId: dto.parentId ?? SPACE_DRIVE_ROOT_ID,
    authorName: dto.authorName?.trim() || "Usuário",
    authorImageUrl: toBrowserMediaUrl(dto.avatarUrl),
    createdAt: dto.createdAt ?? null,
    canDelete: Boolean(dto.canDelete),
  };
}

function mapDriveAncestor(dto: { id: number; name: string }): SpaceDriveAncestor {
  return { id: dto.id, name: dto.name };
}

/**
 * Converte um arquivo do drive no type da intranet.
 * Monta a URL de download em /api/spaces/:id/files/:fileId e o avatar do dono.
 */
export function mapSpaceDriveFile(
  dto: NexchatDriveFile,
  spaceId: number,
): SpaceFile {
  const ownerSpaceId = dto.spaceId || spaceId;
  return {
    id: dto.id,
    folderId: dto.folderId ?? SPACE_DRIVE_ROOT_ID,
    origin: "drive",
    name: dto.name?.trim() || "arquivo",
    url: `/api/spaces/${ownerSpaceId}/files/${dto.id}?origem=drive`,
    mime: dto.mime ?? "",
    sizeBytes: dto.sizeBytes ?? 0,
    isImage: Boolean(dto.isImage),
    isAudio: Boolean(dto.isAudio),
    description: dto.description?.trim() ?? "",
    authorName: dto.authorName?.trim() || "Usuário",
    authorImageUrl: toBrowserMediaUrl(dto.avatarUrl),
    publishedAt: dto.publishedAt ?? null,
    canDelete: Boolean(dto.canDelete),
  };
}

/**
 * Converte o DTO de um evento do Nexchat no type da intranet.
 * Monta a URL da imagem no proxy /api/chat/events/:id/image.
 */
export function mapChatEvent(dto: NexchatSpaceEvent): ChatEvent {
  return {
    id: dto.id,
    spaceId: dto.spaceId ?? 0,
    title: dto.title?.trim() || "Evento",
    description: dto.description?.trim() ?? "",
    locationKind: mapEventLocationKind(dto.locationKind),
    conversationId: dto.conversationId ?? null,
    conversationName: dto.conversationName?.trim() ?? "",
    locationText: dto.locationText?.trim() ?? "",
    startsAt: dto.startsAt ?? "",
    frequency: mapEventFrequency(dto.frequency),
    imageUrl: dto.hasImage ? `/api/chat/events/${dto.id}/image` : "",
    creatorName: dto.creatorName?.trim() || "Usuário",
    creatorImageUrl: toBrowserMediaUrl(dto.creatorImageUrl),
    interestedCount: dto.interestedCount ?? 0,
    isInterested: Boolean(dto.isInterested),
    canEdit: Boolean(dto.canEdit),
  };
}

/**
 * Converte a lista de eventos do Nexchat.
 * Sem payload válido devolve lista vazia e sem permissão de criar.
 */
export function mapChatEventList(dto: NexchatSpaceEventListResult): ChatEventList {
  return {
    canCreate: Boolean(dto.canCreate),
    events: (dto.events ?? []).map(mapChatEvent),
  };
}

function mapEventLocationKind(value?: string): ChatEventLocationKind {
  return value === "elsewhere" ? "elsewhere" : "voice";
}

function mapEventFrequency(value?: string): ChatEventFrequency {
  if (value === "weekly" || value === "monthly") {
    return value;
  }

  return "none";
}

