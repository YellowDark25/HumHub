"use client";

import {
  chatSidebarSections,
  findListedConversation,
  resolveChatWorkspace,
} from "@/application/usecases/assembleChatNavigation";
import type { ChatWorkspace } from "@/domain/ChatWorkspace";
import { HOME_WORKSPACE_ID } from "@/domain/ChatWorkspace";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import type { ConversationLists } from "@/application/ports/ChatRepository";
import {
  readChatConversationId,
  readChatWorkspaceId,
} from "@/shared/chatWorkspace";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { ChatChannelSidebar } from "./ChatChannelSidebar";
import { ChatServerRail } from "./ChatServerRail";

type ChatShellProps = {
  workspaces: ChatWorkspace[];
  lists: ConversationLists;
  currentUser: User | null;
  spacesWithoutServer: Space[];
  children: ReactNode;
};

type ChatShellContextValue = {
  currentWorkspace: ChatWorkspace;
};

const ChatShellContext = createContext<ChatShellContextValue | null>(null);

/**
 * Devolve o workspace ativo do chat persistido no layout.
 * Lê o contexto montado pelo ChatShell; falha se usado fora dele.
 */
export function useChatWorkspace(): ChatWorkspace {
  const value = useContext(ChatShellContext);
  if (!value) {
    throw new Error("useChatWorkspace deve ser usado dentro do ChatShell.");
  }

  return value.currentWorkspace;
}

/**
 * Casca persistente do chat: rail de servidores, sidebar e o painel.
 * Resolve o workspace e a conversa ativa pela URL para o layout não remontar
 * os avatares ao trocar de DM.
 */
export function ChatShell({
  workspaces,
  lists,
  currentUser,
  spacesWithoutServer,
  children,
}: ChatShellProps) {
  return (
    <Suspense
      fallback={
        <ChatShellFrame
          workspaces={workspaces}
          lists={lists}
          currentUser={currentUser}
          spacesWithoutServer={spacesWithoutServer}
          requestedWorkspaceId={HOME_WORKSPACE_ID}
        >
          {children}
        </ChatShellFrame>
      }
    >
      <ChatShellFromUrl
        workspaces={workspaces}
        lists={lists}
        currentUser={currentUser}
        spacesWithoutServer={spacesWithoutServer}
      >
        {children}
      </ChatShellFromUrl>
    </Suspense>
  );
}

/**
 * Lê pathname e search params e monta o frame com o workspace correto.
 * Isolado para o useSearchParams poder suspender sem desmontar o fallback.
 */
function ChatShellFromUrl({
  workspaces,
  lists,
  currentUser,
  spacesWithoutServer,
  children,
}: ChatShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedWorkspaceId = readChatWorkspaceId({
    servidor: searchParams.get("servidor") ?? undefined,
  });
  const activeConversationId = readChatConversationId(pathname);

  return (
    <ChatShellFrame
      workspaces={workspaces}
      lists={lists}
      currentUser={currentUser}
      spacesWithoutServer={spacesWithoutServer}
      requestedWorkspaceId={requestedWorkspaceId}
      activeConversationId={activeConversationId}
    >
      {children}
    </ChatShellFrame>
  );
}

/**
 * Renderiza rail, sidebar e o painel a partir das listas já carregadas.
 * Recalcula seções e workspace no cliente sem remontar a árvore do layout.
 */
function ChatShellFrame({
  workspaces,
  lists,
  currentUser,
  spacesWithoutServer,
  requestedWorkspaceId,
  activeConversationId,
  children,
}: ChatShellProps & {
  requestedWorkspaceId: string;
  activeConversationId?: number;
}) {
  const currentWorkspace = useMemo(
    () =>
      resolveChatWorkspace({
        workspaces,
        requestedId: requestedWorkspaceId,
        conversation: activeConversationId
          ? findListedConversation(lists, activeConversationId)
          : undefined,
      }),
    [workspaces, requestedWorkspaceId, lists, activeConversationId],
  );
  const sections = useMemo(
    () => chatSidebarSections(lists, currentWorkspace),
    [lists, currentWorkspace],
  );
  const hideNavigationOnMobile = Boolean(activeConversationId);

  return (
    <ChatShellContext.Provider value={{ currentWorkspace }}>
      <div className="grid h-full min-h-0 flex-1 overflow-hidden bg-white lg:grid-cols-[80px_288px_minmax(0,1fr)]">
        <ChatServerRail
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspace.id}
          currentUser={currentUser}
          spacesWithoutServer={spacesWithoutServer}
          hiddenOnMobile={hideNavigationOnMobile}
        />
        <ChatChannelSidebar
          workspace={currentWorkspace}
          sections={sections}
          currentUser={currentUser}
          activeConversationId={activeConversationId}
          hiddenOnMobile={hideNavigationOnMobile}
        />
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </ChatShellContext.Provider>
  );
}
