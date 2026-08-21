import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { assembleChatNavigation } from "./assembleChatNavigation";
import { getCurrentUser } from "./getCurrentUser";

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

  return {
    current,
    currentUser,
    messages,
    ...assembleChatNavigation(lists, spaceList, workspaceId, current),
  };
}
