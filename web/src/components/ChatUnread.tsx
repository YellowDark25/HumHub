"use client";

import type { ConversationLists } from "@/application/ports/ChatRepository";
import type { ChatWorkspace } from "@/domain/ChatWorkspace";
import { createContext, useContext, type ReactNode } from "react";
import { useChatUnread } from "./useChatUnread";

type ChatUnreadValue = {
  unreadOf: (conversationId: number | null) => number;
  unreadByWorkspace: Record<string, number>;
};

const ChatUnreadContext = createContext<ChatUnreadValue | null>(null);

/**
 * Expõe os contadores de não lidas do chat para rail e sidebar.
 * Lê o contexto do provider; fora dele devolve zeros.
 */
export function useChatUnreadCounts(): ChatUnreadValue {
  return (
    useContext(ChatUnreadContext) ?? {
      unreadOf: () => 0,
      unreadByWorkspace: {},
    }
  );
}

/**
 * Calcula não lidas uma vez e disponibiliza para a rail e a lista de canais.
 * Encaminha listas e conversa ativa ao hook; filhos só leem o contexto.
 */
export function ChatUnreadProvider({
  lists,
  workspaces,
  activeConversationId,
  children,
}: {
  lists: ConversationLists;
  workspaces: ChatWorkspace[];
  activeConversationId?: number;
  children: ReactNode;
}) {
  const { unreadByConversation, unreadByWorkspace } = useChatUnread({
    lists,
    workspaces,
    activeConversationId,
  });

  return (
    <ChatUnreadContext.Provider
      value={{
        unreadOf: (conversationId) =>
          conversationId ? (unreadByConversation[conversationId] ?? 0) : 0,
        unreadByWorkspace,
      }}
    >
      {children}
    </ChatUnreadContext.Provider>
  );
}
