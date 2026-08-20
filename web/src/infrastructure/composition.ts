import type { NotificationListQuery } from "@/application/NotificationListQuery";
import { addComment } from "@/application/usecases/addComment";
import { countUnseenNotifications } from "@/application/usecases/countUnseenNotifications";
import { createSpace } from "@/application/usecases/createSpace";
import { getConversationPage } from "@/application/usecases/getConversationPage";
import { getCurrentUser } from "@/application/usecases/getCurrentUser";
import { getProfilePage } from "@/application/usecases/getProfilePage";
import { getSpacePage } from "@/application/usecases/getSpacePage";
import { listComments } from "@/application/usecases/listComments";
import { listConversations } from "@/application/usecases/listConversations";
import { listFeed } from "@/application/usecases/listFeed";
import { listNotifications } from "@/application/usecases/listNotifications";
import { listPeople } from "@/application/usecases/listPeople";
import { listSpaces } from "@/application/usecases/listSpaces";
import { login } from "@/application/usecases/login";
import { markAllNotificationsAsSeen } from "@/application/usecases/markAllNotificationsAsSeen";
import { publishPost } from "@/application/usecases/publishPost";
import { requireAdminAccess } from "@/application/usecases/requireAdminAccess";
import { sendMessage } from "@/application/usecases/sendMessage";
import { updateAccountGeneral } from "@/application/usecases/updateAccountGeneral";
import { updateAccountProfile } from "@/application/usecases/updateAccountProfile";
import { updateProfileImage } from "@/application/usecases/updateProfileImage";
import { changeEmail } from "@/application/usecases/changeEmail";
import { changePassword } from "@/application/usecases/changePassword";
import { changeUsername } from "@/application/usecases/changeUsername";
import { deleteAccount } from "@/application/usecases/deleteAccount";
import { getAccount } from "@/application/usecases/getAccount";
import type { AccountPatch, AccountProfile } from "@/domain/Account";
import {
  updateSpaceImage,
  type SpaceImageKind,
} from "@/application/usecases/updateSpaceImage";
import { HumhubAuthRepository } from "./humhub/HumhubAuthRepository";
import { HumhubFeedRepository } from "./humhub/HumhubFeedRepository";
import { HumhubNotificationRepository } from "./humhub/HumhubNotificationRepository";
import { HumhubSpaceRepository } from "./humhub/HumhubSpaceRepository";
import { NexchatChatRepository } from "./nexchat/NexchatChatRepository";

const auth = new HumhubAuthRepository();
const feed = new HumhubFeedRepository();
const spaces = new HumhubSpaceRepository();
const notifications = new HumhubNotificationRepository();
const chat = new NexchatChatRepository();

export const app = {
  login: (username: string, password: string) => login(auth, username, password),
  getCurrentUser: (token: string) => getCurrentUser(auth, token),
  getAccount: (token: string) => getAccount(auth, token),
  updateAccountProfile: (token: string, profile: AccountProfile) =>
    updateAccountProfile(auth, token, profile),
  updateAccountGeneral: (token: string, patch: AccountPatch) =>
    updateAccountGeneral(auth, token, patch),
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
  deleteAccount: (token: string, currentPassword: string) =>
    deleteAccount(auth, token, currentPassword),
  getProfilePage: (token: string) => getProfilePage(token, auth, feed, spaces),
  updateProfileImage: (token: string, imageDataUrl: string) =>
    updateProfileImage(auth, token, imageDataUrl),
  requireAdminAccess: (token: string) => requireAdminAccess(auth, token),
  listFeed: (token: string) => listFeed(token, feed, spaces),
  publishPost: (token: string, spaceId: number, message: string) =>
    publishPost(feed, token, spaceId, message),
  listComments: (token: string, postId: number) =>
    listComments(feed, token, postId),
  addComment: (token: string, postId: number, message: string) =>
    addComment(feed, token, postId, message),
  listSpaces: (token: string) => listSpaces(spaces, token),
  createSpace: (token: string, name: string, description: string) =>
    createSpace(auth, spaces, token, name, description),
  getSpacePage: (token: string, spaceId: number) =>
    getSpacePage(token, spaceId, spaces, feed, auth),
  updateSpaceImage: (
    token: string,
    spaceId: number,
    kind: SpaceImageKind,
    imageDataUrl: string,
  ) => updateSpaceImage(spaces, token, spaceId, kind, imageDataUrl),
  listPeople: (token: string) => listPeople(spaces, token),
  listNotifications: (token: string, query?: NotificationListQuery) =>
    listNotifications(notifications, token, query),
  countUnseenNotifications: (token: string) =>
    countUnseenNotifications(notifications, token),
  markAllNotificationsAsSeen: (token: string) =>
    markAllNotificationsAsSeen(notifications, token),
  listConversations: (token: string) => listConversations(chat, token),
  getConversationPage: (token: string, conversationId: number) =>
    getConversationPage(chat, token, conversationId),
  sendMessage: (token: string, conversationId: number, content: string) =>
    sendMessage(chat, token, conversationId, content),
};
