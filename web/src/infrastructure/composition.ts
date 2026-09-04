import type { NotificationListQuery } from "@/application/NotificationListQuery";
import { addComment } from "@/application/usecases/addComment";
import { countUnseenNotifications } from "@/application/usecases/countUnseenNotifications";
import { createAdminUser } from "@/application/usecases/createAdminUser";
import { createChatServer } from "@/application/usecases/createChatServer";
import { createSpace } from "@/application/usecases/createSpace";
import { enableSpaceServer } from "@/application/usecases/enableSpaceServer";
import { getChatFile } from "@/application/usecases/getChatFile";
import { getHumhubMedia } from "@/application/usecases/getHumhubMedia";
import { getPostFile } from "@/application/usecases/getPostFile";
import { getAppRelease } from "@/application/usecases/getAppRelease";
import { getChatHomePage } from "@/application/usecases/getChatHomePage";
import { getChatNavigation } from "@/application/usecases/getChatNavigation";
import { getConversationPage } from "@/application/usecases/getConversationPage";
import { getConversationView } from "@/application/usecases/getConversationView";
import { getServerNotificationPreference } from "@/application/usecases/getServerNotificationPreference";
import { saveServerNotificationPreference } from "@/application/usecases/saveServerNotificationPreference";
import { getCurrentUser } from "@/application/usecases/getCurrentUser";
import { getChatLiveSubscription } from "@/application/usecases/getChatLiveSubscription";
import { getNotificationLiveSubscription } from "@/application/usecases/getNotificationLiveSubscription";
import { listMessages } from "@/application/usecases/listMessages";
import { openChatLiveStream } from "@/application/usecases/openChatLiveStream";
import { openNotificationLiveStream } from "@/application/usecases/openNotificationLiveStream";
import { openVoiceLiveStream } from "@/application/usecases/openVoiceLiveStream";
import { getNotificationPreferences } from "@/application/usecases/getNotificationPreferences";
import { getPersonPage } from "@/application/usecases/getPersonPage";
import { getProfilePage } from "@/application/usecases/getProfilePage";
import { getSpacePage } from "@/application/usecases/getSpacePage";
import { createSpaceFolder } from "@/application/usecases/createSpaceFolder";
import { deleteSpaceDriveFile } from "@/application/usecases/deleteSpaceDriveFile";
import { deleteSpaceFile } from "@/application/usecases/deleteSpaceFile";
import { deleteSpaceFolder } from "@/application/usecases/deleteSpaceFolder";
import { getSpaceDrive } from "@/application/usecases/getSpaceDrive";
import { getSpaceDriveFile } from "@/application/usecases/getSpaceDriveFile";
import { uploadSpaceFiles } from "@/application/usecases/uploadSpaceFiles";
import { listComments } from "@/application/usecases/listComments";
import { toggleCommentLike } from "@/application/usecases/toggleCommentLike";
import { togglePostLike } from "@/application/usecases/togglePostLike";
import { listConversations } from "@/application/usecases/listConversations";
import { listConversationUpdates } from "@/application/usecases/listConversationUpdates";
import { listFeed } from "@/application/usecases/listFeed";
import { listNotifications } from "@/application/usecases/listNotifications";
import type { CreateChannelInput } from "@/application/ports/ChatRepository";
import { createChannel } from "@/application/usecases/createChannel";
import { createTopic } from "@/application/usecases/createTopic";
import { listChannelMembers } from "@/application/usecases/listChannelMembers";
import { listTopics } from "@/application/usecases/listTopics";
import { deleteChannel } from "@/application/usecases/deleteChannel";
import { getChannelSettings } from "@/application/usecases/getChannelSettings";
import { inviteChannelMember } from "@/application/usecases/inviteChannelMember";
import { acceptSpaceInvite } from "@/application/usecases/acceptSpaceInvite";
import { declineSpaceInvite } from "@/application/usecases/declineSpaceInvite";
import { inviteSpaceMembers } from "@/application/usecases/inviteSpaceMembers";
import { followSpace } from "@/application/usecases/followSpace";
import { leaveSpace } from "@/application/usecases/leaveSpace";
import { listReceivedSpaceInvites } from "@/application/usecases/listReceivedSpaceInvites";
import { listSpaceInvitees } from "@/application/usecases/listSpaceInvitees";
import { listVisibleSpaces } from "@/application/usecases/listVisibleSpaces";
import { updateSpaceMembershipSettings } from "@/application/usecases/updateSpaceMembershipSettings";
import { joinVoiceRoom } from "@/application/usecases/joinVoiceRoom";
import { leaveVoiceRoom } from "@/application/usecases/leaveVoiceRoom";
import { listVoiceOccupancy } from "@/application/usecases/listVoiceOccupancy";
import { listVoiceRoom } from "@/application/usecases/listVoiceRoom";
import { openDirectMessage } from "@/application/usecases/openDirectMessage";
import { removeChannelMember } from "@/application/usecases/removeChannelMember";
import { updateChannel } from "@/application/usecases/updateChannel";
import { blockPerson } from "@/application/usecases/blockPerson";
import { followPerson } from "@/application/usecases/followPerson";
import { listPeople } from "@/application/usecases/listPeople";
import { unfollowPerson } from "@/application/usecases/unfollowPerson";
import { listSpaces } from "@/application/usecases/listSpaces";
import { login } from "@/application/usecases/login";
import { markAllNotificationsAsSeen } from "@/application/usecases/markAllNotificationsAsSeen";
import { publishPost } from "@/application/usecases/publishPost";
import { requireAdminAccess } from "@/application/usecases/requireAdminAccess";
import { resetNotificationPreferences } from "@/application/usecases/resetNotificationPreferences";
import { saveAdminSettings } from "@/application/usecases/saveAdminSettings";
import { saveNotificationPreferences } from "@/application/usecases/saveNotificationPreferences";
import { finishDirectCallLog } from "@/application/usecases/finishDirectCallLog";
import { deleteMessage } from "@/application/usecases/deleteMessage";
import { editMessage } from "@/application/usecases/editMessage";
import { forwardMessage } from "@/application/usecases/forwardMessage";
import { listForwardTargets } from "@/application/usecases/listForwardTargets";
import { reactToMessage } from "@/application/usecases/reactToMessage";
import { sendMessage } from "@/application/usecases/sendMessage";
import { sendTyping } from "@/application/usecases/sendTyping";
import { startDirectCallLog } from "@/application/usecases/startDirectCallLog";
import { setAdminUserStatus } from "@/application/usecases/setAdminUserStatus";
import { updateAccountGeneral } from "@/application/usecases/updateAccountGeneral";
import { updateAccountProfile } from "@/application/usecases/updateAccountProfile";
import { updateAdminUser } from "@/application/usecases/updateAdminUser";
import { updateProfileImage } from "@/application/usecases/updateProfileImage";
import { changeEmail } from "@/application/usecases/changeEmail";
import { changePassword } from "@/application/usecases/changePassword";
import { completeRequiredPasswordChange } from "@/application/usecases/completeRequiredPasswordChange";
import { changeUsername } from "@/application/usecases/changeUsername";
import { deleteAccount } from "@/application/usecases/deleteAccount";
import { deleteAdminUser } from "@/application/usecases/deleteAdminUser";
import { disableAccountModule } from "@/application/usecases/disableAccountModule";
import { enableAccountModule } from "@/application/usecases/enableAccountModule";
import { getAccount } from "@/application/usecases/getAccount";
import { getAccountGeneralSettings } from "@/application/usecases/getAccountGeneralSettings";
import { getAdminInformation } from "@/application/usecases/getAdminInformation";
import { getAdminSettings } from "@/application/usecases/getAdminSettings";
import { getAdminUser } from "@/application/usecases/getAdminUser";
import { impersonateAdminUser } from "@/application/usecases/impersonateAdminUser";
import { listAccountModules } from "@/application/usecases/listAccountModules";
import { addAdminGroupMember } from "@/application/usecases/addAdminGroupMember";
import { createAdminGroup } from "@/application/usecases/createAdminGroup";
import { deleteAdminGroup } from "@/application/usecases/deleteAdminGroup";
import { getAdminGroup } from "@/application/usecases/getAdminGroup";
import { listAdminGroupMembers } from "@/application/usecases/listAdminGroupMembers";
import { listAdminGroupPermissions } from "@/application/usecases/listAdminGroupPermissions";
import { listAdminGroups } from "@/application/usecases/listAdminGroups";
import { removeAdminGroupMember } from "@/application/usecases/removeAdminGroupMember";
import { setAdminGroupMemberManager } from "@/application/usecases/setAdminGroupMemberManager";
import { setAdminGroupPermission } from "@/application/usecases/setAdminGroupPermission";
import { updateAdminGroup } from "@/application/usecases/updateAdminGroup";
import { createAdminProfileCategory } from "@/application/usecases/createAdminProfileCategory";
import { createAdminProfileField } from "@/application/usecases/createAdminProfileField";
import { deleteAdminProfileCategory } from "@/application/usecases/deleteAdminProfileCategory";
import { deleteAdminProfileField } from "@/application/usecases/deleteAdminProfileField";
import { getAdminProfileCategory } from "@/application/usecases/getAdminProfileCategory";
import { getAdminProfileField } from "@/application/usecases/getAdminProfileField";
import { listAdminProfileCatalog } from "@/application/usecases/listAdminProfileCatalog";
import { updateAdminProfileCategory } from "@/application/usecases/updateAdminProfileCategory";
import { updateAdminProfileField } from "@/application/usecases/updateAdminProfileField";
import { listAdminModules } from "@/application/usecases/listAdminModules";
import { deleteAdminSpace } from "@/application/usecases/deleteAdminSpace";
import { listAdminSpaces } from "@/application/usecases/listAdminSpaces";
import { listAdminUsers } from "@/application/usecases/listAdminUsers";
import { listCustomPages } from "@/application/usecases/listCustomPages";
import {
  disableAdminModule,
  enableAdminModule,
} from "@/application/usecases/toggleAdminModule";
import type { VoiceMediaState } from "@/domain/VoiceRoom";
import type { CreateSpaceInput } from "@/domain/Space";
import type { SpaceInviteInput } from "@/domain/SpaceInvite";
import type { SpaceMembershipSettingsPatch } from "@/domain/SpaceMembershipSettings";
import type { AccountProfile } from "@/domain/Account";
import type { AccountGeneralPatch } from "@/domain/AccountGeneralSettings";
import type { AdminGroupInput, AdminGroupPermissionState } from "@/domain/AdminGroup";
import type {
  AdminProfileCategoryInput,
  AdminProfileFieldInput,
} from "@/domain/AdminProfile";
import type { AdminSettingsPatch } from "@/domain/AdminSettings";
import type {
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "@/domain/AdminUser";
import type { ChatNotificationPreferencePatch } from "@/domain/ChatNotificationPreference";
import type { NotificationPreferencePatch } from "@/domain/NotificationPreferences";
import {
  updateSpaceImage,
  type SpaceImageKind,
} from "@/application/usecases/updateSpaceImage";
import { EnvAppReleaseRepository } from "./app/EnvAppReleaseRepository";
import { HumhubAccountModulesRepository } from "./humhub/HumhubAccountModulesRepository";
import { HumhubAccountSettingsRepository } from "./humhub/HumhubAccountSettingsRepository";
import { HumhubAdminGroupRepository } from "./humhub/HumhubAdminGroupRepository";
import { HumhubAdminProfileRepository } from "./humhub/HumhubAdminProfileRepository";
import { HumhubAdminSystemRepository } from "./humhub/HumhubAdminSystemRepository";
import { HumhubAdminUserRepository } from "./humhub/HumhubAdminUserRepository";
import { HumhubAuthRepository } from "./humhub/HumhubAuthRepository";
import { HumhubFeedRepository } from "./humhub/HumhubFeedRepository";
import { HumhubMediaRepository } from "./humhub/HumhubMediaRepository";
import { HumhubNotificationRepository } from "./humhub/HumhubNotificationRepository";
import { HumhubSpaceRepository } from "./humhub/HumhubSpaceRepository";
import { createSpaceEvent } from "@/application/usecases/createSpaceEvent";
import { getSpaceEventImage } from "@/application/usecases/getSpaceEventImage";
import { listSpaceEvents } from "@/application/usecases/listSpaceEvents";
import { toggleSpaceEventInterest } from "@/application/usecases/toggleSpaceEventInterest";
import type { CreateChatEventInput } from "@/domain/ChatEvent";
import { NexchatChatEventRepository } from "./nexchat/NexchatChatEventRepository";
import { NexchatChatRepository } from "./nexchat/NexchatChatRepository";
import { NexchatSpaceDriveRepository } from "./nexchat/NexchatSpaceDriveRepository";
import { LiveKitVoiceRoomRepository } from "./voice/LiveKitVoiceRoomRepository";
import { disconnectGoogleAccount } from "@/application/usecases/disconnectGoogleAccount";
import { finishGoogleConnect } from "@/application/usecases/finishGoogleConnect";
import { getGoogleAccountStatus } from "@/application/usecases/getGoogleAccountStatus";
import { handleSecretaryTurn } from "@/application/usecases/handleSecretaryTurn";
import { openSecretaryDm } from "@/application/usecases/openSecretaryDm";
import { startGoogleConnect } from "@/application/usecases/startGoogleConnect";
import type { SecretaryTurnInput } from "@/domain/SecretaryTurn";
import { GoogleOAuthRepository } from "./google/GoogleOAuthRepository";
import { GoogleWorkspaceRepository } from "./google/GoogleWorkspaceRepository";
import { AnthropicLlmRepository } from "./llm/AnthropicLlmRepository";
import { GeminiSpeechToTextRepository } from "./llm/GeminiSpeechToTextRepository";
import { NexchatGoogleAccountRepository } from "./nexchat/NexchatGoogleAccountRepository";
import { NexchatSecretaryDispatchRepository } from "./nexchat/NexchatSecretaryDispatchRepository";
import { getSecretaryUserId } from "./config";

const appRelease = new EnvAppReleaseRepository();
const auth = new HumhubAuthRepository();
const accountSettings = new HumhubAccountSettingsRepository();
const accountModules = new HumhubAccountModulesRepository();
const adminUsers = new HumhubAdminUserRepository();
const adminGroups = new HumhubAdminGroupRepository();
const adminProfiles = new HumhubAdminProfileRepository();
const adminSystem = new HumhubAdminSystemRepository();
const feed = new HumhubFeedRepository();
const spaces = new HumhubSpaceRepository();
const notifications = new HumhubNotificationRepository();
const chat = new NexchatChatRepository();
const chatEvents = new NexchatChatEventRepository();
const spaceDrive = new NexchatSpaceDriveRepository();
const voiceRooms = new LiveKitVoiceRoomRepository();
const media = new HumhubMediaRepository();
const secretaryDispatch = new NexchatSecretaryDispatchRepository();
const secretaryLlm = new AnthropicLlmRepository();
const secretarySpeech = new GeminiSpeechToTextRepository();
const googleWorkspace = new GoogleWorkspaceRepository();
const googleAccounts = new NexchatGoogleAccountRepository();
const googleOAuth = new GoogleOAuthRepository();

export const app = {
  login: (username: string, password: string) => login(auth, username, password),
  getAppRelease: () => getAppRelease(appRelease),
  getCurrentUser: (token: string) => getCurrentUser(auth, token),
  getAccount: (token: string) => getAccount(auth, token),
  getAccountGeneralSettings: (token: string) =>
    getAccountGeneralSettings(accountSettings, token),
  updateAccountProfile: (token: string, profile: AccountProfile) =>
    updateAccountProfile(auth, token, profile),
  updateAccountGeneral: (token: string, patch: AccountGeneralPatch) =>
    updateAccountGeneral(accountSettings, token, patch),
  listAccountModules: (token: string) =>
    listAccountModules(accountModules, token),
  enableAccountModule: (token: string, moduleId: string) =>
    enableAccountModule(accountModules, token, moduleId),
  disableAccountModule: (token: string, moduleId: string) =>
    disableAccountModule(accountModules, token, moduleId),
  changeUsername: (token: string, username: string, currentPassword: string) =>
    changeUsername(auth, token, username, currentPassword),
  changeEmail: (token: string, email: string, currentPassword: string) =>
    changeEmail(auth, token, email, currentPassword),
  changePassword: (
    token: string,
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string,
  ) =>
    changePassword(
      auth,
      token,
      currentPassword,
      newPassword,
      newPasswordConfirm,
    ),
  completeRequiredPasswordChange: (
    token: string,
    newPassword: string,
    newPasswordConfirm: string,
  ) =>
    completeRequiredPasswordChange(
      auth,
      token,
      newPassword,
      newPasswordConfirm,
    ),
  deleteAccount: (token: string, currentPassword: string) =>
    deleteAccount(auth, token, currentPassword),
  getProfilePage: (token: string) => getProfilePage(token, auth, feed, spaces),
  listReceivedSpaceInvites: (token: string) =>
    listReceivedSpaceInvites(spaces, token),
  acceptSpaceInvite: (token: string, spaceId: number) =>
    acceptSpaceInvite(spaces, token, spaceId),
  declineSpaceInvite: (token: string, spaceId: number) =>
    declineSpaceInvite(spaces, token, spaceId),
  getPersonPage: (token: string, userId: number) =>
    getPersonPage(auth, feed, token, userId),
  updateProfileImage: (token: string, imageDataUrl: string) =>
    updateProfileImage(auth, token, imageDataUrl),
  requireAdminAccess: (token: string) => requireAdminAccess(auth, token),
  listAdminUsers: (token: string) => listAdminUsers(auth, adminUsers, token),
  getAdminUser: (token: string, userId: number) =>
    getAdminUser(auth, adminUsers, token, userId),
  createAdminUser: (token: string, input: CreateAdminUserInput) =>
    createAdminUser(auth, adminUsers, token, input),
  updateAdminUser: (
    token: string,
    userId: number,
    input: UpdateAdminUserInput,
  ) => updateAdminUser(auth, adminUsers, token, userId, input),
  setAdminUserStatus: (
    token: string,
    userId: number,
    status: "active" | "disabled",
  ) => setAdminUserStatus(auth, adminUsers, token, userId, status),
  deleteAdminUser: (token: string, userId: number) =>
    deleteAdminUser(auth, adminUsers, token, userId),
  impersonateAdminUser: (token: string, userId: number) =>
    impersonateAdminUser(auth, token, userId),
  listAdminGroups: (token: string) => listAdminGroups(auth, adminGroups, token),
  getAdminGroup: (token: string, groupId: number) =>
    getAdminGroup(auth, adminGroups, token, groupId),
  createAdminGroup: (token: string, input: AdminGroupInput) =>
    createAdminGroup(auth, adminGroups, token, input),
  updateAdminGroup: (token: string, groupId: number, input: AdminGroupInput) =>
    updateAdminGroup(auth, adminGroups, token, groupId, input),
  deleteAdminGroup: (token: string, groupId: number) =>
    deleteAdminGroup(auth, adminGroups, token, groupId),
  listAdminGroupMembers: (token: string, groupId: number) =>
    listAdminGroupMembers(auth, adminGroups, token, groupId),
  addAdminGroupMember: (
    token: string,
    groupId: number,
    userId: number,
    isManager: boolean,
  ) => addAdminGroupMember(auth, adminGroups, token, groupId, userId, isManager),
  removeAdminGroupMember: (token: string, groupId: number, userId: number) =>
    removeAdminGroupMember(auth, adminGroups, token, groupId, userId),
  setAdminGroupMemberManager: (
    token: string,
    groupId: number,
    userId: number,
    isManager: boolean,
  ) =>
    setAdminGroupMemberManager(
      auth,
      adminGroups,
      token,
      groupId,
      userId,
      isManager,
    ),
  listAdminGroupPermissions: (token: string, groupId: number) =>
    listAdminGroupPermissions(auth, adminGroups, token, groupId),
  setAdminGroupPermission: (
    token: string,
    groupId: number,
    permissionId: string,
    moduleId: string,
    state: AdminGroupPermissionState,
  ) =>
    setAdminGroupPermission(
      auth,
      adminGroups,
      token,
      groupId,
      permissionId,
      moduleId,
      state,
    ),
  listAdminProfileCatalog: (token: string) =>
    listAdminProfileCatalog(auth, adminProfiles, token),
  getAdminProfileCategory: (token: string, categoryId: number) =>
    getAdminProfileCategory(auth, adminProfiles, token, categoryId),
  createAdminProfileCategory: (
    token: string,
    input: AdminProfileCategoryInput,
  ) => createAdminProfileCategory(auth, adminProfiles, token, input),
  updateAdminProfileCategory: (
    token: string,
    categoryId: number,
    input: AdminProfileCategoryInput,
  ) =>
    updateAdminProfileCategory(auth, adminProfiles, token, categoryId, input),
  deleteAdminProfileCategory: (token: string, categoryId: number) =>
    deleteAdminProfileCategory(auth, adminProfiles, token, categoryId),
  getAdminProfileField: (token: string, fieldId: number) =>
    getAdminProfileField(auth, adminProfiles, token, fieldId),
  createAdminProfileField: (token: string, input: AdminProfileFieldInput) =>
    createAdminProfileField(auth, adminProfiles, token, input),
  updateAdminProfileField: (
    token: string,
    fieldId: number,
    input: AdminProfileFieldInput,
  ) => updateAdminProfileField(auth, adminProfiles, token, fieldId, input),
  deleteAdminProfileField: (token: string, fieldId: number) =>
    deleteAdminProfileField(auth, adminProfiles, token, fieldId),
  listAdminSpaces: (token: string) => listAdminSpaces(auth, spaces, token),
  deleteAdminSpace: (token: string, spaceId: number) =>
    deleteAdminSpace(auth, spaces, token, spaceId),
  listAdminModules: (token: string) => listAdminModules(auth, adminSystem, token),
  enableAdminModule: (token: string, moduleId: string) =>
    enableAdminModule(auth, adminSystem, token, moduleId),
  disableAdminModule: (token: string, moduleId: string) =>
    disableAdminModule(auth, adminSystem, token, moduleId),
  listCustomPages: (token: string) => listCustomPages(auth, adminSystem, token),
  getAdminInformation: (token: string) =>
    getAdminInformation(auth, adminSystem, token),
  getAdminSettings: (token: string) => getAdminSettings(auth, adminSystem, token),
  saveAdminSettings: (token: string, patch: AdminSettingsPatch) =>
    saveAdminSettings(auth, adminSystem, token, patch),
  listFeed: (token: string) => listFeed(token, feed, spaces),
  publishPost: (
    token: string,
    spaceId: number,
    message: string,
    files: File[] = [],
  ) => publishPost(feed, token, spaceId, message, files),
  getPostFile: (token: string, fileId: number) => getPostFile(feed, token, fileId),
  getSpaceDrive: (token: string, spaceId: number, folderId = 0) =>
    getSpaceDrive(spaceDrive, token, spaceId, folderId),
  createSpaceFolder: (
    token: string,
    spaceId: number,
    parentId: number,
    name: string,
  ) => createSpaceFolder(spaceDrive, token, spaceId, parentId, name),
  deleteSpaceFolder: (token: string, spaceId: number, folderId: number) =>
    deleteSpaceFolder(spaceDrive, token, spaceId, folderId),
  uploadSpaceFiles: (
    token: string,
    spaceId: number,
    files: File[],
    description = "",
    folderId = 0,
  ) => uploadSpaceFiles(spaceDrive, token, spaceId, files, description, folderId),
  deleteSpaceFile: (token: string, spaceId: number, fileId: number) =>
    deleteSpaceFile(feed, spaces, auth, token, spaceId, fileId),
  deleteSpaceDriveFile: (token: string, spaceId: number, fileId: number) =>
    deleteSpaceDriveFile(spaceDrive, token, spaceId, fileId),
  getSpaceDriveFile: (token: string, spaceId: number, fileId: number) =>
    getSpaceDriveFile(spaceDrive, token, spaceId, fileId),
  listComments: (token: string, postId: number, page = 1) =>
    listComments(feed, token, postId, page),
  addComment: (token: string, postId: number, message: string) =>
    addComment(feed, token, postId, message),
  togglePostLike: (token: string, postId: number) =>
    togglePostLike(feed, token, postId),
  toggleCommentLike: (token: string, commentId: number) =>
    toggleCommentLike(feed, token, commentId),
  listSpaces: (token: string) => listSpaces(spaces, token),
  listVisibleSpaces: (token: string) => listVisibleSpaces(spaces, token),
  createSpace: (
    token: string,
    input: CreateSpaceInput & { createServer: boolean },
  ) => createSpace(auth, spaces, chat, token, input),
  createChatServer: (token: string, name: string) =>
    createChatServer(auth, spaces, chat, token, name),
  enableSpaceServer: (token: string, spaceId: number) =>
    enableSpaceServer(chat, token, spaceId),
  getSpacePage: (token: string, spaceId: number) =>
    getSpacePage(token, spaceId, spaces, feed, auth),
  updateSpaceImage: (
    token: string,
    spaceId: number,
    kind: SpaceImageKind,
    imageDataUrl: string,
  ) => updateSpaceImage(spaces, token, spaceId, kind, imageDataUrl),
  listSpaceInvitees: (token: string, spaceId: number) =>
    listSpaceInvitees(spaces, token, spaceId),
  inviteSpaceMembers: (
    token: string,
    spaceId: number,
    input: SpaceInviteInput,
  ) => inviteSpaceMembers(spaces, token, spaceId, input),
  updateSpaceMembershipSettings: (
    token: string,
    spaceId: number,
    patch: SpaceMembershipSettingsPatch,
  ) => updateSpaceMembershipSettings(spaces, token, spaceId, patch),
  leaveSpace: (token: string, spaceId: number) =>
    leaveSpace(spaces, token, spaceId),
  followSpace: (token: string, spaceId: number) =>
    followSpace(spaces, token, spaceId),
  listPeople: (token: string) => listPeople(auth, token),
  followPerson: (token: string, userId: number) =>
    followPerson(auth, token, userId),
  unfollowPerson: (token: string, userId: number) =>
    unfollowPerson(auth, token, userId),
  blockPerson: (token: string, userId: number) =>
    blockPerson(auth, token, userId),
  listNotifications: (token: string, query?: NotificationListQuery) =>
    listNotifications(notifications, token, query),
  getNotificationPreferences: (token: string) =>
    getNotificationPreferences(notifications, token),
  saveNotificationPreferences: (
    token: string,
    patch: NotificationPreferencePatch,
  ) => saveNotificationPreferences(notifications, token, patch),
  resetNotificationPreferences: (token: string) =>
    resetNotificationPreferences(notifications, token),
  countUnseenNotifications: (token: string) =>
    countUnseenNotifications(notifications, token),
  markAllNotificationsAsSeen: (token: string) =>
    markAllNotificationsAsSeen(notifications, token),
  getNotificationLiveSubscription: (token: string) =>
    getNotificationLiveSubscription(notifications, token),
  openNotificationLiveStream: (token: string) =>
    openNotificationLiveStream(notifications, token),
  listConversations: (token: string) => listConversations(chat, token),
  listConversationUpdates: (token: string) =>
    listConversationUpdates(chat, token),
  getChatNavigation: (token: string) =>
    getChatNavigation(chat, spaces, auth, token),
  getChatHomePage: (token: string, workspaceId: string) =>
    getChatHomePage(chat, spaces, auth, token, workspaceId),
  getConversationPage: (
    token: string,
    conversationId: number,
    workspaceId: string,
  ) =>
    getConversationPage(chat, spaces, auth, token, conversationId, workspaceId),
  getConversationView: (
    token: string,
    conversationId: number,
    workspaceId: string,
  ) =>
    getConversationView(chat, spaces, auth, token, conversationId, workspaceId),
  listMessages: (token: string, conversationId: number, since?: number) =>
    listMessages(chat, token, conversationId, since ?? 0),
  getChatLiveSubscription: (token: string, conversationId: number) =>
    getChatLiveSubscription(chat, token, conversationId),
  openChatLiveStream: (token: string, conversationId: number) =>
    openChatLiveStream(chat, token, conversationId),
  getServerNotificationPreference: (token: string, spaceId: number) =>
    getServerNotificationPreference(chat, token, spaceId),
  saveServerNotificationPreference: (
    token: string,
    patch: ChatNotificationPreferencePatch,
  ) => saveServerNotificationPreference(chat, token, patch),
  sendMessage: (
    token: string,
    conversationId: number,
    content: string,
    files?: File[],
    replyToId?: number,
  ) => sendMessage(chat, token, conversationId, content, files ?? [], replyToId ?? 0),
  editMessage: (token: string, messageId: number, content: string) =>
    editMessage(chat, token, messageId, content),
  deleteMessage: (token: string, messageId: number) =>
    deleteMessage(chat, token, messageId),
  reactToMessage: (token: string, messageId: number, emoji: string) =>
    reactToMessage(chat, token, messageId, emoji),
  forwardMessage: (
    token: string,
    input: {
      messageId: number;
      conversationIds: number[];
      userIds?: number[];
      comment?: string;
    },
  ) => forwardMessage(chat, token, input),
  listForwardTargets: (token: string) => listForwardTargets(chat, token),
  startDirectCallLog: (token: string, conversationId: number) =>
    startDirectCallLog(chat, token, conversationId),
  finishDirectCallLog: (
    token: string,
    messageId: number,
    durationSeconds: number,
  ) => finishDirectCallLog(chat, token, messageId, durationSeconds),
  sendTyping: (token: string, conversationId: number, isTyping: boolean) =>
    sendTyping(chat, token, conversationId, isTyping),
  getChatFile: (token: string, fileId: number) => getChatFile(chat, token, fileId),
  getHumhubMedia: (token: string, path: string, search?: string) =>
    getHumhubMedia(media, token, path, search),
  openDirectMessage: (token: string, userId: number) =>
    openDirectMessage(chat, token, userId),
  openSecretaryDm: (token: string) =>
    openSecretaryDm(chat, token, getSecretaryUserId()),
  handleSecretaryTurn: (input: SecretaryTurnInput) =>
    handleSecretaryTurn(
      secretaryDispatch,
      secretaryLlm,
      secretarySpeech,
      googleWorkspace,
      input,
    ),
  getGoogleAccountStatus: (token: string) =>
    getGoogleAccountStatus(googleAccounts, token),
  startGoogleConnect: (token: string) =>
    startGoogleConnect(auth, googleOAuth, token),
  finishGoogleConnect: (token: string, code: string, state: string) =>
    finishGoogleConnect(auth, googleOAuth, googleAccounts, token, code, state),
  disconnectGoogleAccount: (token: string) =>
    disconnectGoogleAccount(googleAccounts, token),
  createChannel: (token: string, input: CreateChannelInput) =>
    createChannel(chat, token, input),
  listSpaceEvents: (token: string, spaceId: number) =>
    listSpaceEvents(chatEvents, token, spaceId),
  createSpaceEvent: (token: string, input: CreateChatEventInput) =>
    createSpaceEvent(chatEvents, token, input),
  getSpaceEventImage: (token: string, eventId: number) =>
    getSpaceEventImage(chatEvents, token, eventId),
  toggleSpaceEventInterest: (token: string, eventId: number) =>
    toggleSpaceEventInterest(chatEvents, token, eventId),
  listTopics: (token: string, conversationId: number) =>
    listTopics(chat, token, conversationId),
  createTopic: (
    token: string,
    input: {
      conversationId: number;
      name: string;
      isPrivate: boolean;
      message: string;
    },
  ) => createTopic(chat, token, input),
  getChannelSettings: (token: string, conversationId: number) =>
    getChannelSettings(chat, token, conversationId),
  listChannelMembers: (token: string, conversationId: number) =>
    listChannelMembers(chat, token, conversationId),
  updateChannel: (
    token: string,
    conversationId: number,
    input: { name: string; topic: string; slowModeSeconds: number },
  ) => updateChannel(chat, token, conversationId, input),
  deleteChannel: (token: string, conversationId: number) =>
    deleteChannel(chat, token, conversationId),
  inviteChannelMember: (
    token: string,
    conversationId: number,
    userId: number,
  ) => inviteChannelMember(chat, token, conversationId, userId),
  removeChannelMember: (
    token: string,
    conversationId: number,
    userId: number,
  ) => removeChannelMember(chat, token, conversationId, userId),
  joinVoiceRoom: (
    token: string,
    conversationId: number,
    media: VoiceMediaState,
  ) => joinVoiceRoom(chat, auth, voiceRooms, token, conversationId, media),
  leaveVoiceRoom: (token: string, conversationId: number) =>
    leaveVoiceRoom(chat, auth, voiceRooms, token, conversationId),
  listVoiceRoom: (token: string, conversationId: number) =>
    listVoiceRoom(chat, voiceRooms, token, conversationId),
  listVoiceOccupancy: (token: string) =>
    listVoiceOccupancy(chat, voiceRooms, token),
  openVoiceLiveStream: (token: string) => openVoiceLiveStream(chat, token),
};
