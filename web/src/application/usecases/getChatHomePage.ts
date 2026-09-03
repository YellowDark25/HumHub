import { chatNotificationSpaceId } from "@/shared/chatNotification";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { assembleChatNavigation } from "./assembleChatNavigation";
import { getChatNavigation } from "./getChatNavigation";
import { loadServerNotificationPreference } from "./loadServerNotificationPreference";

/**
 * Monta a home do chat (workspace atual, seções e preferência de notificação).
 * Reusa a navegação compartilhada, resolve o servidor pedido e carrega o mute.
 */
export async function getChatHomePage(
  chat: ChatRepository,
  spaces: SpaceRepository,
  auth: AuthRepository,
  token: string,
  workspaceId: string,
) {
  const navigation = await getChatNavigation(chat, spaces, auth, token);
  const assembled = assembleChatNavigation(
    navigation.lists,
    navigation.spaceList,
    workspaceId,
  );
  const spaceId = chatNotificationSpaceId(assembled.currentWorkspace);

  return {
    currentUser: navigation.currentUser,
    notificationPreference: await loadServerNotificationPreference(
      chat,
      token,
      spaceId,
    ),
    ...assembled,
  };
}
