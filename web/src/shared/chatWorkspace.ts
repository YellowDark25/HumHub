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
