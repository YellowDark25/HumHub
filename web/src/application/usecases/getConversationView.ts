import type { ConversationView } from "@/domain/ConversationView";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { getConversationPage } from "./getConversationPage";

/**
 * Monta o painel de uma conversa sem a navegação da sidebar.
 * Reusa getConversationPage e extrai só o que o cliente precisa para a aba.
 */
export async function getConversationView(
  chat: ChatRepository,
  spaces: SpaceRepository,
  auth: AuthRepository,
  token: string,
  conversationId: number,
  workspaceId: string,
): Promise<ConversationView> {
  const page = await getConversationPage(
    chat,
    spaces,
    auth,
    token,
    conversationId,
    workspaceId,
  );

  if (!page.currentUser) {
    throw new ApplicationError("Usuário da sessão não encontrado.", 401);
  }

  const peerItem = page.sections
    .flatMap((section) => section.items)
    .find((item) => item.conversationId === page.current.id);
  const parent = page.lists.channels.find(
    (channel) => channel.id === page.current.parentConversationId,
  );

  return {
    conversation: page.current,
    currentUser: page.currentUser,
    messages: page.messages,
    notificationPreference: page.notificationPreference,
    mutualServers: page.mutualServers,
    peer: page.peer,
    workspaceId: page.currentWorkspace.id,
    workspaceName: page.currentWorkspace.name,
    parentName: parent?.name ?? null,
    peerUserId: peerItem?.userId ?? null,
    peerUsername: peerItem?.username ?? "",
    peerImageUrl: peerItem?.imageUrl ?? "",
  };
}
