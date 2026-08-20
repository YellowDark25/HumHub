import type { NotificationListQuery } from "@/application/NotificationListQuery";
import { addComment } from "@/application/usecases/addComment";
import { countUnseenNotifications } from "@/application/usecases/countUnseenNotifications";
import { getConversationPage } from "@/application/usecases/getConversationPage";
import { getCurrentUser } from "@/application/usecases/getCurrentUser";
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
import { sendMessage } from "@/application/usecases/sendMessage";
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
  listFeed: (token: string) => listFeed(token, feed, spaces),
  publishPost: (token: string, spaceId: number, message: string) =>
    publishPost(feed, token, spaceId, message),
  listComments: (token: string, postId: number) =>
    listComments(feed, token, postId),
  addComment: (token: string, postId: number, message: string) =>
    addComment(feed, token, postId, message),
  listSpaces: (token: string) => listSpaces(spaces, token),
  getSpacePage: (token: string, spaceId: number) =>
    getSpacePage(token, spaceId, spaces, feed),
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
