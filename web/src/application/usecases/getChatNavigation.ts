import { cache } from "react";
import type { ChatWorkspace } from "@/domain/ChatWorkspace";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import type { AuthRepository } from "../ports/AuthRepository";
import type {
  ChatRepository,
  ConversationLists,
} from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { buildChatWorkspaces } from "./assembleChatNavigation";
import { getCurrentUser } from "./getCurrentUser";

/**
 * Dados compartilhados da navegação do chat (listas, servidores e usuário).
 * Alimenta o layout persistente e as páginas que resolvem o workspace.
 */
export type ChatNavigation = {
  lists: ConversationLists;
  spaceList: Space[];
  workspaces: ChatWorkspace[];
  currentUser: User;
  spacesWithoutServer: Space[];
};

/**
 * Carrega a navegação compartilhada do chat (listas, servidores e usuário).
 * Busca conversas, espaços e o usuário em paralelo; o React cache evita
 * repetir a mesma carga quando o layout e a página rodam no mesmo request.
 */
export const getChatNavigation = cache(async function getChatNavigation(
  chat: ChatRepository,
  spaces: SpaceRepository,
  auth: AuthRepository,
  token: string,
): Promise<ChatNavigation> {
  const [lists, spaceList, currentUser] = await Promise.all([
    chat.listConversations(token),
    spaces.list(token),
    getCurrentUser(auth, token),
  ]);

  return {
    lists,
    spaceList,
    workspaces: buildChatWorkspaces(spaceList, lists.spaceServerIds),
    currentUser,
    spacesWithoutServer: spaceList.filter(
      (space) => !lists.spaceServerIds.includes(space.id),
    ),
  };
});
