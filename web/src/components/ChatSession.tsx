"use client";

import {
  chatConversationHref,
  chatWorkspaceHref,
  readChatRoute,
} from "@/shared/chatWorkspace";
import { HOME_WORKSPACE_ID } from "@/domain/ChatWorkspace";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatRoute = {
  conversationId?: number;
  workspaceId: string;
};

type ChatSessionValue = ChatRoute & {
  openConversation: (conversationId: number, workspaceId: string) => void;
  openWorkspace: (workspaceId: string) => void;
};

const ChatSessionContext = createContext<ChatSessionValue | null>(null);

/**
 * Devolve a sessão do chat (conversa e servidor ativos).
 * Lê o contexto do ChatSessionProvider; falha se usado fora dele.
 */
export function useChatSession(): ChatSessionValue {
  const value = useContext(ChatSessionContext);
  if (!value) {
    throw new Error("useChatSession deve ser usado dentro do ChatSessionProvider.");
  }

  return value;
}

/**
 * Abre uma conversa na sessão do chat ou, fora do chat, navega com o Next.
 * Dentro do shell só troca a aba; em Pessoas/Espaços faz o push normal.
 */
export function useOpenChatConversation() {
  const session = useContext(ChatSessionContext);
  const router = useRouter();

  return (conversationId: number, workspaceId = HOME_WORKSPACE_ID) => {
    if (session) {
      session.openConversation(conversationId, workspaceId);
      return;
    }

    router.push(chatConversationHref(conversationId, workspaceId));
  };
}

/**
 * Guarda a aba ativa do chat e sincroniza a URL sem o Next recarregar a página.
 * Clique troca o estado; voltar/avançar do browser relê o endereço.
 */
export function ChatSessionProvider({
  initialRoute,
  nextPathname,
  nextSearch = "",
  children,
}: {
  initialRoute: ChatRoute;
  nextPathname?: string;
  nextSearch?: string;
  children: ReactNode;
}) {
  const [route, setRoute] = useState(initialRoute);

  useEffect(() => {
    if (!nextPathname) {
      return;
    }

    setRoute(readChatRoute(nextPathname, nextSearch));
  }, [nextPathname, nextSearch]);

  useEffect(() => {
    function syncFromLocation() {
      setRoute(readChatRoute(window.location.pathname, window.location.search));
    }

    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  const openConversation = useCallback(
    (conversationId: number, workspaceId: string) => {
      const next = { conversationId, workspaceId };
      window.history.pushState({ chat: true }, "", chatConversationHref(
        conversationId,
        workspaceId,
      ));
      setRoute(next);
    },
    [],
  );

  const openWorkspace = useCallback((workspaceId: string) => {
    const next = { conversationId: undefined, workspaceId };
    window.history.pushState({ chat: true }, "", chatWorkspaceHref(workspaceId));
    setRoute(next);
  }, []);

  const value = useMemo(
    () => ({
      ...route,
      openConversation,
      openWorkspace,
    }),
    [route, openConversation, openWorkspace],
  );

  return (
    <ChatSessionContext.Provider value={value}>
      {children}
    </ChatSessionContext.Provider>
  );
}
