import type { Account, AccountPatch, AccountProfile } from "@/domain/Account";
import type {
  AccountGeneralPatch,
  AccountGeneralSettings,
  AccountSelectOption,
} from "@/domain/AccountGeneralSettings";
import { emptyAccountProfile } from "@/domain/Account";
import type { Activity } from "@/domain/Activity";
import type { Comment } from "@/domain/Comment";
import type { Notification } from "@/domain/Notification";
import type { NotificationPreferences } from "@/domain/NotificationPreferences";
import type { AccountProfileModule } from "@/domain/AccountProfileModule";
import type { Post } from "@/domain/Post";
import type { Space } from "@/domain/Space";
import type { SpaceMember } from "@/domain/SpaceMember";
import type { User } from "@/domain/User";
import { stripHtml } from "@/shared/format";
import { accountModuleCopy } from "@/shared/accountProfileFields";
import { getPublicHumhubUrl } from "../config";
import {
  HUMHUB_EDITOR_PLAIN,
  HUMHUB_EDITOR_RICH_TEXT,
  PROFILE_IMAGE_FOLDER,
  SPACE_BANNER_FOLDER,
  UNKNOWN_AUTHOR,
} from "./constants";
import type {
  HumhubAccountModules,
  HumhubAccountProfileModule,
  HumhubAccountSettings,
  HumhubActivity,
  HumhubBlockedUser,
  HumhubComment,
  HumhubMembership,
  HumhubNotification,
  HumhubNotificationPreferenceCategory,
  HumhubNotificationPreferences,
  HumhubSelectOption,
  HumhubPost,
  HumhubProfile,
  HumhubSpace,
  HumhubUser,
  HumhubUserShort,
} from "./types";

export function mapUser(
  dto: HumhubUser | HumhubUserShort,
  isAdmin = false,
): User {
  const account = "account" in dto ? dto.account : undefined;
  const profile = "profile" in dto ? dto.profile : undefined;

  return {
    id: dto.id,
    name: dto.display_name,
    title: profile?.title?.trim() ?? "",
    username: account?.username?.trim() ?? "",
    email: account?.email?.trim() ?? "",
    about: profile?.about?.trim() ?? "",
    tags: readTags(account?.tags),
    imageUrl: mapUserImage(dto),
    isAdmin,
  };
}

function mapUserImage(
  dto?: HumhubUser | HumhubUserShort | null,
): string {
  if (!dto) {
    return "";
  }

  const profile = "profile" in dto ? dto.profile : undefined;
  return resolvePublicImageUrl(profile?.image_url) || imageUrlFromGuid(dto.guid);
}

function imageUrlFromGuid(guid: string): string {
  const trimmed = guid.trim();
  if (!trimmed) {
    return "";
  }

  return `${getPublicHumhubUrl()}/${PROFILE_IMAGE_FOLDER}/${trimmed}.jpg`;
}

export function mapAccount(dto: HumhubUser): Account {
  const account = dto.account;
  const profile = dto.profile;

  return {
    userId: dto.id,
    username: text(account?.username),
    email: text(account?.email),
    tags: readTags(account?.tags),
    language: text(account?.language) || "pt-BR",
    timeZone: text(account?.time_zone) || "America/Sao_Paulo",
    visibility: account?.visibility ?? 1,
    profile: mapAccountProfile(profile),
  };
}

export function toHumhubProfile(profile: AccountProfile): HumhubProfile {
  return {
    firstname: profile.firstName,
    lastname: profile.lastName,
    title: profile.title,
    gender: profile.gender,
    street: profile.street,
    zip: profile.zip,
    city: profile.city,
    country: profile.country,
    state: profile.state,
    birthday: profile.birthday,
    about: profile.about,
    phone_private: profile.phonePrivate,
    phone_work: profile.phoneWork,
    mobile: profile.mobile,
    fax: profile.fax,
    im_skype: profile.skype,
    im_xmpp: profile.xmpp,
    url: profile.website,
    url_facebook: profile.facebook,
    url_linkedin: profile.linkedin,
    url_xing: profile.xing,
    url_youtube: profile.youtube,
    url_vimeo: profile.vimeo,
    url_flickr: profile.flickr,
    url_myspace: profile.myspace,
    url_twitter: profile.twitter,
  };
}

export function toHumhubAccount(patch: AccountPatch) {
  return {
    ...(patch.username !== undefined ? { username: patch.username } : {}),
    ...(patch.email !== undefined ? { email: patch.email } : {}),
    ...(patch.language !== undefined ? { language: patch.language } : {}),
    ...(patch.timeZone !== undefined ? { time_zone: patch.timeZone } : {}),
    ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
    ...(patch.tags !== undefined ? { tagsField: patch.tags } : {}),
  };
}

export function mapAccountSettings(
  dto: HumhubAccountSettings,
): AccountGeneralSettings {
  return {
    tags: readTags(dto.tags),
    language: text(dto.language) || "pt-BR",
    timeZone: text(dto.timeZone) || "America/Sao_Paulo",
    visibility: dto.visibility ?? 1,
    hideOnlineStatus: Boolean(dto.hideOnlineStatus),
    hideTourPanel: Boolean(dto.hideTourPanel),
    markdownEditorMode:
      dto.markdownEditorMode === HUMHUB_EDITOR_PLAIN ? "plain" : "rich",
    blockedUsers: (dto.blockedUsers ?? [])
      .map(mapBlockedUser)
      .filter((user) => user.id > 0),
    languages: mapSelectOptions(dto.languages),
    timeZones: mapSelectOptions(dto.timeZones),
    visibilityOptions: mapSelectOptions(dto.visibilityOptions),
    editorModes: mapSelectOptions(dto.editorModes),
    showVisibility: Boolean(dto.showVisibility),
    visibilityEditable: dto.visibilityEditable !== false,
    showOnlineStatus: dto.showOnlineStatus !== false,
    showTourPanel: Boolean(dto.showTourPanel),
    showBlockedUsers: Boolean(dto.showBlockedUsers),
  };
}

export function toHumhubAccountSettings(patch: AccountGeneralPatch) {
  return {
    tags: patch.tags,
    language: patch.language,
    timeZone: patch.timeZone,
    visibility: patch.visibility,
    hideOnlineStatus: patch.hideOnlineStatus,
    hideTourPanel: patch.hideTourPanel,
    markdownEditorMode:
      patch.markdownEditorMode === "plain"
        ? HUMHUB_EDITOR_PLAIN
        : HUMHUB_EDITOR_RICH_TEXT,
    blockedUserIds: patch.blockedUserIds,
  };
}

export function mapAccountModules(
  dto: HumhubAccountModules,
): AccountProfileModule[] {
  return (dto.modules ?? [])
    .map(mapAccountProfileModule)
    .filter((module) => module.id !== "");
}

function mapAccountProfileModule(
  dto: HumhubAccountProfileModule,
): AccountProfileModule {
  const configUrl = dto.configUrl?.trim() ?? "";
  const id = dto.id?.trim() ?? "";
  const copy = accountModuleCopy(id, text(dto.name) || "Módulo", text(dto.description));

  return {
    id,
    name: copy.name,
    version: text(dto.version),
    description: copy.description,
    imageUrl: resolvePublicImageUrl(dto.imageUrl),
    isEnabled: Boolean(dto.isEnabled),
    canEnable: Boolean(dto.canEnable),
    canDisable: Boolean(dto.canDisable),
    configUrl: configUrl ? resolvePublicImageUrl(configUrl) : null,
  };
}

function mapBlockedUser(dto: HumhubBlockedUser) {
  return {
    id: dto.id ?? 0,
    name: text(dto.name) || "Usuário",
  };
}

function mapSelectOptions(
  options: HumhubSelectOption[] | undefined,
): AccountSelectOption[] {
  return (options ?? [])
    .map((option) => ({
      value: option.value?.trim() ?? "",
      label: option.label?.trim() ?? option.value?.trim() ?? "",
    }))
    .filter((option) => option.value !== "" && option.label !== "");
}

function mapAccountProfile(profile?: HumhubProfile): AccountProfile {
  const empty = emptyAccountProfile();
  if (!profile) {
    return empty;
  }

  return {
    ...empty,
    firstName: text(profile.firstname),
    lastName: text(profile.lastname),
    title: text(profile.title),
    gender: text(profile.gender),
    street: text(profile.street),
    zip: text(profile.zip),
    city: text(profile.city),
    country: text(profile.country),
    state: text(profile.state),
    birthday: toDateInput(profile.birthday),
    about: text(profile.about),
    phonePrivate: text(profile.phone_private),
    phoneWork: text(profile.phone_work),
    mobile: text(profile.mobile),
    fax: text(profile.fax),
    skype: text(profile.im_skype),
    xmpp: text(profile.im_xmpp),
    website: text(profile.url),
    facebook: text(profile.url_facebook),
    linkedin: text(profile.url_linkedin),
    xing: text(profile.url_xing),
    youtube: text(profile.url_youtube),
    vimeo: text(profile.url_vimeo),
    flickr: text(profile.url_flickr),
    myspace: text(profile.url_myspace),
    twitter: text(profile.url_twitter),
  };
}

function text(value?: string): string {
  return value?.trim() ?? "";
}

function toDateInput(value?: string): string {
  return text(value).slice(0, 10);
}

function readTags(tags: string[] | undefined): string[] {
  if (!tags) {
    return [];
  }

  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function resolvePublicImageUrl(imageUrl?: string): string {
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

export function mapSpace(dto: HumhubSpace): Space {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    imageUrl: imageUrlFromGuid(dto.guid),
    bannerUrl: bannerUrlFromGuid(dto.guid),
  };
}

function bannerUrlFromGuid(guid: string): string {
  const trimmed = guid.trim();
  if (!trimmed) {
    return "";
  }

  return `${getPublicHumhubUrl()}/${SPACE_BANNER_FOLDER}/${trimmed}.jpg`;
}

export function mapComment(dto: HumhubComment): Comment {
  return {
    id: dto.id,
    authorName: dto.createdBy?.display_name ?? UNKNOWN_AUTHOR,
    authorImageUrl: mapUserImage(dto.createdBy),
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
    authorId: dto.content.metadata.created_by?.id ?? null,
    authorName: dto.content.metadata.created_by?.display_name ?? UNKNOWN_AUTHOR,
    authorImageUrl: mapUserImage(dto.content.metadata.created_by),
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
    originatorImageUrl: mapUserImage(dto.originator),
    publishedAt: dto.createdAt ?? null,
    isUnseen,
  };
}

export function mapNotificationPreferences(
  dto: HumhubNotificationPreferences,
): NotificationPreferences {
  return {
    spaceIds: (dto.spaceIds ?? []).filter((id) => Number.isFinite(id) && id > 0),
    categories: (dto.categories ?? [])
      .map(mapPreferenceCategory)
      .filter((category) => category.id !== ""),
  };
}

function mapPreferenceCategory(
  dto: HumhubNotificationPreferenceCategory,
): NotificationPreferences["categories"][number] {
  return {
    id: dto.id?.trim() ?? "",
    title: dto.title?.trim() || "Notificação",
    description: dto.description?.trim() ?? "",
    web: Boolean(dto.web),
    email: Boolean(dto.email),
    webEditable: dto.webEditable !== false,
    emailEditable: dto.emailEditable !== false,
  };
}

export function mapActivity(dto: HumhubActivity): Activity {
  return {
    id: dto.id,
    text: stripHtml(dto.content?.output ?? ""),
    originatorName: dto.originator?.display_name ?? UNKNOWN_AUTHOR,
    originatorImageUrl: mapUserImage(dto.originator),
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
