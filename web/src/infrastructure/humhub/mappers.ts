import type { Activity } from "@/domain/Activity";
import type { Comment } from "@/domain/Comment";
import type { Notification } from "@/domain/Notification";
import type { Post } from "@/domain/Post";
import type { Space } from "@/domain/Space";
import type { SpaceMember } from "@/domain/SpaceMember";
import type { User } from "@/domain/User";
import { stripHtml } from "@/shared/format";
import { UNKNOWN_AUTHOR } from "./constants";
import type {
  HumhubActivity,
  HumhubComment,
  HumhubMembership,
  HumhubNotification,
  HumhubPost,
  HumhubSpace,
  HumhubUser,
  HumhubUserShort,
} from "./types";

export function mapUser(dto: HumhubUser | HumhubUserShort): User {
  return {
    id: dto.id,
    name: dto.display_name,
  };
}

export function mapSpace(dto: HumhubSpace): Space {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
  };
}

export function mapComment(dto: HumhubComment): Comment {
  return {
    id: dto.id,
    authorName: dto.createdBy?.display_name ?? UNKNOWN_AUTHOR,
    message: dto.message,
    publishedAt: dto.createdAt ?? null,
  };
}

export function mapPost(
  dto: HumhubPost,
  spaceId: number | null,
  spaceName: string | null,
): Post {
  return {
    id: dto.id,
    spaceId,
    spaceName,
    authorName: dto.content.metadata.created_by?.display_name ?? UNKNOWN_AUTHOR,
    message: dto.message,
    publishedAt: dto.content.metadata.created_at,
    likeCount: dto.content.likes?.total ?? 0,
    commentCount: dto.content.comments?.total ?? 0,
    latestComments: (dto.content.comments?.latest ?? []).map(mapComment),
  };
}

export function mapNotification(
  dto: HumhubNotification,
  isUnseen = false,
): Notification {
  return {
    id: dto.id,
    text: stripHtml(dto.output ?? "") || "Nova notificação",
    originatorName: dto.originator?.display_name ?? null,
    publishedAt: dto.createdAt ?? null,
    isUnseen,
  };
}

export function mapActivity(dto: HumhubActivity): Activity {
  return {
    id: dto.id,
    text: stripHtml(dto.content?.output ?? ""),
    publishedAt: dto.createdAt ?? null,
  };
}

export function mapSpaceMember(dto: HumhubMembership): SpaceMember | null {
  if (!dto.user?.id) {
    return null;
  }

  return {
    user: mapUser(dto.user),
    role: dto.role ?? "",
  };
}
