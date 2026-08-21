import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { assembleChatNavigation } from "./assembleChatNavigation";
import { getCurrentUser } from "./getCurrentUser";

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

  return {
    currentUser,
    ...assembleChatNavigation(lists, spaceList, workspaceId),
  };
}
