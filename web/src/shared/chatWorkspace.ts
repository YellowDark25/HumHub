import { HOME_WORKSPACE_ID } from "@/domain/ChatWorkspace";

export function readChatWorkspaceId(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const raw = Array.isArray(searchParams.servidor)
    ? searchParams.servidor[0]
    : searchParams.servidor;
  const value = raw?.trim();

  return value || HOME_WORKSPACE_ID;
}

export function chatWorkspaceHref(workspaceId: string): string {
  if (workspaceId === HOME_WORKSPACE_ID) {
    return "/chat";
  }

  return `/chat?servidor=${workspaceId}`;
}

export function chatConversationHref(
  conversationId: number,
  workspaceId: string,
): string {
  if (workspaceId === HOME_WORKSPACE_ID) {
    return `/chat/${conversationId}`;
  }

  return `/chat/${conversationId}?servidor=${workspaceId}`;
}

/**
 * Lê workspace e conversa a partir do pathname e da query do chat.
 * Usado no boot da sessão e no voltar/avançar do browser.
 */
export function readChatRoute(
  pathname: string,
  search: string,
): {
  conversationId?: number;
  workspaceId: string;
} {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);

  return {
    conversationId: readChatConversationId(pathname),
    workspaceId: readChatWorkspaceId({
      servidor: params.get("servidor") ?? undefined,
    }),
  };
}

/**
 * Lê o id da conversa a partir do pathname `/chat/:id`.
 * Ignora a home (`/chat`) e valores que não sejam um inteiro positivo.
 * @returns id da conversa, ou undefined quando a rota não é de uma conversa.
 */
export function readChatConversationId(pathname: string): number | undefined {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "chat" || !segments[1]) {
    return undefined;
  }

  const conversationId = Number(segments[1]);
  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return undefined;
  }

  return conversationId;
}
