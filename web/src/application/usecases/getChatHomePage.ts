import { chatNotificationSpaceId } from "@/shared/chatNotification";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { assembleChatNavigation } from "./assembleChatNavigation";
import { getCurrentUser } from "./getCurrentUser";
import { loadServerNotificationPreference } from "./loadServerNotificationPreference";

export async function getChatHomePage(
  chat: ChatRepository,
  spaces: SpaceRepository,
  auth: AuthRepository,
  token: string,
  workspaceId: string,
) {
  const [lists, spaceList, currentUser] = await Promise.all([
    chat.listConversations(token),
    spaces.list(token),
    getCurrentUser(auth, token),
  ]);
  const navigation = assembleChatNavigation(lists, spaceList, workspaceId);
  const spaceId = chatNotificationSpaceId(navigation.currentWorkspace);

  return {
    currentUser,
    notificationPreference: await loadServerNotificationPreference(
      chat,
      token,
      spaceId,
    ),
    ...navigation,
  };
}
