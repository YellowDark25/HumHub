import { chatNotificationSpaceId } from "@/shared/chatNotification";
import type { Person } from "@/domain/Person";
import { ApplicationError, isUnauthorized } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import {
  assembleChatNavigation,
  findListedConversation,
} from "./assembleChatNavigation";
import { getChatNavigation } from "./getChatNavigation";
import { listMutualServers } from "./listMutualServers";
import { loadServerNotificationPreference } from "./loadServerNotificationPreference";

/**
 * Monta a página de uma conversa (mensagens, peer e preferência do servidor).
 * Reusa a navegação compartilhada, localiza a conversa e busca o restante em paralelo.
 */
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

  const [navigation, messages] = await Promise.all([
    getChatNavigation(chat, spaces, auth, token),
    chat.listMessages(token, conversationId),
  ]);
  const current = findListedConversation(navigation.lists, conversationId);

  if (!current) {
    throw new ApplicationError("Conversa não encontrada.", 404);
  }

  const assembled = assembleChatNavigation(
    navigation.lists,
    navigation.spaceList,
    workspaceId,
    current,
  );
  const spaceId = chatNotificationSpaceId(assembled.currentWorkspace);
  const peerUserId =
    current.kind === "dm"
      ? navigation.lists.contacts.find(
          (contact) => contact.conversationId === conversationId,
        )?.userId ?? 0
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
    currentUser: navigation.currentUser,
    messages,
    notificationPreference,
    mutualServers,
    peer,
    ...assembled,
  };
}

/**
 * Carrega o perfil do peer da DM sem derrubar a página se o HumHub falhar.
 * Propaga só 401; qualquer outro erro vira null.
 */
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
