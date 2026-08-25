import { chatNotificationSpaceId } from "@/shared/chatNotification";
import { ApplicationError, isUnauthorized } from "../errors";
import type { Person } from "@/domain/Person";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { assembleChatNavigation } from "./assembleChatNavigation";
import { getCurrentUser } from "./getCurrentUser";
import { listMutualServers } from "./listMutualServers";
import { loadServerNotificationPreference } from "./loadServerNotificationPreference";

export async function getConversationPage(
  chat: ChatRepository,
  spaces: SpaceRepository,
  auth: AuthRepository,
  token: string,
  conversationId: number,
  workspaceId: string,
) {
  if (!conversationId) {
    throw new ApplicationError("Conversa inválida.", 404);
  }

  const [lists, spaceList, messages, currentUser] = await Promise.all([
    chat.listConversations(token),
    spaces.list(token),
    chat.listMessages(token, conversationId),
    getCurrentUser(auth, token),
  ]);

  const current = [...lists.channels, ...lists.dms, ...lists.pendingInvites].find(
    (item) => item.id === conversationId,
  );

  if (!current) {
    throw new ApplicationError("Conversa não encontrada.", 404);
  }

  const navigation = assembleChatNavigation(
    lists,
    spaceList,
    workspaceId,
    current,
  );
  const spaceId = chatNotificationSpaceId(navigation.currentWorkspace);
  const peerUserId =
    current.kind === "dm"
      ? lists.contacts.find((contact) => contact.conversationId === conversationId)
          ?.userId ?? 0
      : 0;

  const [notificationPreference, mutualServers, peer] = await Promise.all([
    loadServerNotificationPreference(chat, token, spaceId),
    peerUserId > 0
      ? listMutualServers(chat, token, peerUserId)
      : Promise.resolve([]),
    loadPeerPerson(auth, token, peerUserId),
  ]);

  return {
    current,
    currentUser,
    messages,
    notificationPreference,
    mutualServers,
    peer,
    ...navigation,
  };
}

async function loadPeerPerson(
  auth: AuthRepository,
  token: string,
  peerUserId: number,
): Promise<Person | null> {
  if (peerUserId <= 0) {
    return null;
  }

  try {
    return await auth.getPerson(token, peerUserId);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    return null;
  }
}
