"use client";

import { ChatConversationView } from "./ChatConversationView";
import { ChatWelcome } from "./ChatWelcome";
import { useChatSession } from "./ChatSession";

/**
 * Conteúdo do painel direito do chat.
 * Sem conversa mostra o welcome; com id, troca só este painel.
 */
export function ChatMainPanel() {
  const { conversationId, workspaceId } = useChatSession();

  if (!conversationId) {
    return <ChatWelcome />;
  }

  return (
    <ChatConversationView
      conversationId={conversationId}
      workspaceId={workspaceId}
    />
  );
}
