import type { Account, AccountPatch, AccountProfile } from "@/domain/Account";
import type { AdminGroup, AdminGroupMember, AdminGroupPermission, AdminGroupPermissionState } from "@/domain/AdminGroup";
import type { AdminInformation } from "@/domain/AdminInformation";
import type { AdminModule } from "@/domain/AdminModule";
import type {
  AdminProfileCatalog,
  AdminProfileCategory,
  AdminProfileField,
  AdminProfileFieldKind,
  AdminProfileFieldType,
} from "@/domain/AdminProfile";
import type {
  AdminSelectOption,
  AdminSettings,
} from "@/domain/AdminSettings";
import type { AdminUser, AdminUserStatus } from "@/domain/AdminUser";
import type { CustomPage } from "@/domain/CustomPage";
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
import type { ReceivedSpaceInvite, SpaceInvitee } from "@/domain/SpaceInvite";
import type { SpaceMember } from "@/domain/SpaceMember";
import type { User } from "@/domain/User";
import { isRecentlyOnline } from "@/shared/onlineStatus";
import { stripHtml } from "@/shared/format";
import { notificationHref } from "@/shared/notificationHref";
import { accountModuleCopy } from "@/shared/accountProfileFields";
import { getPublicHumhubUrl } from "../config";
import {
  HUMHUB_EDITOR_PLAIN,
  HUMHUB_EDITOR_RICH_TEXT,
  HUMHUB_USER_STATUS_DISABLED,
  HUMHUB_USER_STATUS_ENABLED,
  HUMHUB_USER_STATUS_NEED_APPROVAL,
  HUMHUB_USER_STATUS_SOFT_DELETED,
  PROFILE_IMAGE_FOLDER,
  SPACE_BANNER_FOLDER,
  UNKNOWN_AUTHOR,
} from "./constants";
import type {
  HumhubAccountModules,
  HumhubAccountProfileModule,
  HumhubAccountSettings,
  HumhubActivity,
  HumhubAdminGroup,
  HumhubAdminGroupMember,
  HumhubAdminGroups,
  HumhubAdminGroupMembers,
  HumhubAdminGroupPermission,
  HumhubAdminGroupPermissions,
  HumhubAdminInformation,
  HumhubAdminModule,
  HumhubAdminModules,
  HumhubAdminProfileCatalog,
  HumhubAdminProfileCategory,
  HumhubAdminProfileField,
  HumhubAdminProfileFieldType,
  HumhubAdminSettings,
  HumhubBlockedUser,
  HumhubComment,
  HumhubCustomPage,
  HumhubCustomPages,
  HumhubMembership,
  HumhubSpaceInvitee,
  HumhubReceivedSpaceInvite,
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
  const account =
    dto && typeof dto === "object" && "account" in dto
      ? dto.account
      : undefined;
  const profile =
    dto && typeof dto === "object" && "profile" in dto
      ? dto.profile
      : undefined;

  return {
    id: dto.id,
    name: dto.display_name,
    title: profile?.title?.trim() ?? "",
    username: account?.username?.trim() ?? "",
    email: account?.email?.trim() ?? "",
    about: profile?.about?.trim() ?? "",
    tags: readTags(account?.tags),
    imageUrl: mapUserImage(dto),
    isOnline: isRecentlyOnline(account?.last_login),
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
  const text = stripHtml(dto.output ?? "") || "Nova notificação";

  return {
    id: dto.id,
    text,
    originatorName: dto.originator?.display_name ?? null,
    originatorImageUrl: mapUserImage(dto.originator),
    publishedAt: dto.createdAt ?? null,
    isUnseen,
    href: notificationHref(text),
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

export function mapAdminUser(dto: HumhubUser | HumhubUserShort): AdminUser {
  const user = mapUser(dto);
  const account = "account" in dto ? dto.account : undefined;
  const profile = "profile" in dto ? dto.profile : undefined;

  return {
    id: user.id,
    name: user.name,
    title: user.title,
    firstName: profile?.firstname?.trim() ?? "",
    lastName: profile?.lastname?.trim() ?? "",
    username: user.username,
    email: user.email,
    imageUrl: user.imageUrl,
    lastLogin: text(account?.last_login ?? "") || null,
    status: mapUserStatus(account?.status),
  };
}

export function mapAdminGroups(dto: HumhubAdminGroups): AdminGroup[] {
  return (dto.groups ?? [])
    .map(mapAdminGroup)
    .filter((group) => group.id > 0);
}

export function mapAdminGroup(dto: HumhubAdminGroup): AdminGroup {
  return {
    id: dto.id ?? 0,
    name: text(dto.name) || "Grupo",
    description: text(dto.description),
    type: dto.type === "subgroup" ? "subgroup" : "normal",
    memberCount: dto.memberCount ?? 0,
    extraMemberCount: dto.extraMemberCount ?? 0,
    isDefault: Boolean(dto.isDefault),
    isProtected: Boolean(dto.isProtected),
    isAdminGroup: Boolean(dto.isAdminGroup),
    showAtDirectory: Boolean(dto.showAtDirectory),
    showAtRegistration: Boolean(dto.showAtRegistration),
    notifyUsers: Boolean(dto.notifyUsers),
    sortOrder: dto.sortOrder ?? 100,
    canDelete: Boolean(dto.canDelete),
  };
}

export function mapAdminGroupMembers(
  dto: HumhubAdminGroupMembers,
): AdminGroupMember[] {
  return (dto.members ?? [])
    .map(mapAdminGroupMember)
    .filter((member) => member.id > 0);
}

function mapAdminGroupMember(dto: HumhubAdminGroupMember): AdminGroupMember {
  return {
    id: dto.id ?? 0,
    name: text(dto.name) || "Usuário",
    email: text(dto.email),
    imageUrl: text(dto.imageUrl),
    isManager: Boolean(dto.isManager),
  };
}

export function mapAdminGroupPermissions(
  dto: HumhubAdminGroupPermissions,
): AdminGroupPermission[] {
  return (dto.permissions ?? [])
    .map(mapAdminGroupPermission)
    .filter((permission) => permission.id !== "" && permission.moduleId !== "");
}

function mapAdminGroupPermission(
  dto: HumhubAdminGroupPermission,
): AdminGroupPermission {
  return {
    id: text(dto.id),
    moduleId: text(dto.moduleId),
    moduleName: text(dto.moduleName) || "Módulo",
    title: text(dto.title) || "Permissão",
    description: text(dto.description),
    state: readPermissionState(dto.state),
    defaultLabel: text(dto.defaultLabel) || "Padrão",
    canChange: Boolean(dto.canChange),
  };
}

function readPermissionState(value?: string): AdminGroupPermissionState {
  if (value === "allow" || value === "deny") {
    return value;
  }

  return "default";
}

export function mapAdminProfileCatalog(
  dto: HumhubAdminProfileCatalog,
): AdminProfileCatalog {
  return {
    categories: (dto.categories ?? [])
      .map(mapAdminProfileCategory)
      .filter((category) => category.id > 0),
    fieldTypes: (dto.fieldTypes ?? [])
      .map(mapAdminProfileFieldType)
      .filter((type) => type.id !== "other"),
  };
}

export function mapAdminProfileCategory(
  dto: HumhubAdminProfileCategory,
): AdminProfileCategory {
  return {
    id: dto.id ?? 0,
    title: text(dto.title) || "Categoria",
    description: text(dto.description),
    sortOrder: dto.sortOrder ?? 100,
    isSystem: Boolean(dto.isSystem),
    canDelete: Boolean(dto.canDelete),
    fields: (dto.fields ?? [])
      .map(mapAdminProfileField)
      .filter((field) => field.id > 0),
  };
}

export function mapAdminProfileField(
  dto: HumhubAdminProfileField,
): AdminProfileField {
  return {
    id: dto.id ?? 0,
    categoryId: dto.categoryId ?? 0,
    internalName: text(dto.internalName),
    title: text(dto.title) || "Campo",
    description: text(dto.description),
    kind: readProfileFieldKind(dto.kind),
    kindLabel: text(dto.kindLabel) || "Campo",
    sortOrder: dto.sortOrder ?? 100,
    isRequired: Boolean(dto.isRequired),
    isVisible: Boolean(dto.isVisible),
    isEditable: Boolean(dto.isEditable),
    isSearchable: Boolean(dto.isSearchable),
    showAtRegistration: Boolean(dto.showAtRegistration),
    isSystem: Boolean(dto.isSystem),
    isVirtual: Boolean(dto.isVirtual),
    canDelete: Boolean(dto.canDelete),
  };
}

function mapAdminProfileFieldType(
  dto: HumhubAdminProfileFieldType,
): AdminProfileFieldType {
  return {
    id: readProfileFieldKind(dto.id),
    label: text(dto.label) || "Campo",
  };
}

const PROFILE_FIELD_KINDS = new Set<AdminProfileFieldKind>([
  "text",
  "textarea",
  "number",
  "select",
  "date",
  "datetime",
  "birthday",
  "country",
  "markdown",
  "checkbox",
  "checkboxList",
  "userEmail",
  "userName",
  "userMemberSince",
  "userLastLogin",
  "userGroups",
  "template",
  "other",
]);

function readProfileFieldKind(value?: string): AdminProfileFieldKind {
  return PROFILE_FIELD_KINDS.has(value as AdminProfileFieldKind)
    ? (value as AdminProfileFieldKind)
    : "other";
}

export function mapAdminModules(dto: HumhubAdminModules): AdminModule[] {
  return (dto.modules ?? [])
    .map(mapAdminModule)
    .filter((module) => module.id !== "");
}

function mapAdminModule(dto: HumhubAdminModule): AdminModule {
  return {
    id: dto.id?.trim() ?? "",
    name: text(dto.name) || "Módulo",
    version: text(dto.version),
    description: text(dto.description),
    isEnabled: Boolean(dto.isEnabled),
    canEnable: Boolean(dto.canEnable),
    canDisable: Boolean(dto.canDisable),
  };
}

export function mapCustomPages(dto: HumhubCustomPages): CustomPage[] {
  return (dto.pages ?? [])
    .map(mapCustomPage)
    .filter((page) => page.id > 0);
}

function mapCustomPage(dto: HumhubCustomPage): CustomPage {
  return {
    id: dto.id ?? 0,
    title: text(dto.title) || "Página",
    type: text(dto.type),
    target: text(dto.target),
    isAdminOnly: Boolean(dto.isAdminOnly),
  };
}

export function mapAdminInformation(
  dto: HumhubAdminInformation,
): AdminInformation {
  return {
    appName: text(dto.appName) || "NexHub",
    version: text(dto.version),
    phpVersion: text(dto.phpVersion),
    databaseDriver: text(dto.databaseDriver),
    databaseName: text(dto.databaseName),
    baseUrl: text(dto.baseUrl),
    isDebug: Boolean(dto.isDebug),
  };
}

export function mapAdminSettings(dto: HumhubAdminSettings): AdminSettings {
  return {
    name: text(dto.name),
    baseUrl: text(dto.baseUrl),
    defaultLanguage: text(dto.defaultLanguage) || "pt-BR",
    timeZone: text(dto.timeZone) || "America/Sao_Paulo",
    maintenanceMode: Boolean(dto.maintenanceMode),
    languages: mapAdminSelectOptions(dto.languages),
    timeZones: mapAdminSelectOptions(dto.timeZones),
  };
}

function mapAdminSelectOptions(
  options: HumhubSelectOption[] | undefined,
): AdminSelectOption[] {
  return mapSelectOptions(options);
}

function mapUserStatus(status?: number): AdminUserStatus {
  if (status === HUMHUB_USER_STATUS_DISABLED) {
    return "disabled";
  }

  if (status === HUMHUB_USER_STATUS_NEED_APPROVAL) {
    return "unapproved";
  }

  if (status === HUMHUB_USER_STATUS_SOFT_DELETED) {
    return "deleted";
  }

  if (status === HUMHUB_USER_STATUS_ENABLED) {
    return "active";
  }

  return "active";
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

export function mapSpaceInvitee(dto: HumhubSpaceInvitee): SpaceInvitee | null {
  if (!dto.id) {
    return null;
  }

  return {
    id: dto.id,
    name: dto.name?.trim() || "Usuário",
    username: dto.username?.trim() ?? "",
    imageUrl: dto.imageUrl?.trim() ?? "",
  };
}

export function mapReceivedSpaceInvite(
  dto: HumhubReceivedSpaceInvite,
): ReceivedSpaceInvite | null {
  if (!dto.spaceId) {
    return null;
  }

  return {
    spaceId: dto.spaceId,
    spaceName: dto.spaceName?.trim() || "Espaço",
    spaceImageUrl: dto.spaceImageUrl?.trim() ?? "",
    invitedByName: dto.invitedByName?.trim() ?? "",
  };
}
