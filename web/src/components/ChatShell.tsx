"use client";

import {
  chatSidebarSections,
  findListedConversation,
  resolveChatWorkspace,
} from "@/application/usecases/assembleChatNavigation";
import type { ConversationLists } from "@/application/ports/ChatRepository";
import type { ChatWorkspace } from "@/domain/ChatWorkspace";
import { HOME_WORKSPACE_ID } from "@/domain/ChatWorkspace";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
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
import { ChatMainPanel } from "./ChatMainPanel";
import { ChatServerRail } from "./ChatServerRail";
import { ChatSessionProvider, useChatSession } from "./ChatSession";

type ChatShellProps = {
  workspaces: ChatWorkspace[];
  lists: ConversationLists;
  currentUser: User | null;
  spacesWithoutServer: Space[];
  children?: ReactNode;
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
 * Casca persistente do chat: rail, sidebar e o painel da aba ativa.
 * A URL muda com history.pushState; o Next não troca de página ao clicar numa DM.
 */
export function ChatShell({
  workspaces,
  lists,
  currentUser,
  spacesWithoutServer,
}: ChatShellProps) {
  return (
    <Suspense
      fallback={
        <ChatShellReady
          workspaces={workspaces}
          lists={lists}
          currentUser={currentUser}
          spacesWithoutServer={spacesWithoutServer}
          initialWorkspaceId={HOME_WORKSPACE_ID}
        />
      }
    >
      <ChatShellFromUrl
        workspaces={workspaces}
        lists={lists}
        currentUser={currentUser}
        spacesWithoutServer={spacesWithoutServer}
      />
    </Suspense>
  );
}

/**
 * Lê a URL do Next só no primeiro paint (refresh ou entrada pelo menu).
 * Isolado para o useSearchParams poder suspender.
 */
function ChatShellFromUrl({
  workspaces,
  lists,
  currentUser,
  spacesWithoutServer,
}: ChatShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <ChatShellReady
      workspaces={workspaces}
      lists={lists}
      currentUser={currentUser}
      spacesWithoutServer={spacesWithoutServer}
      initialWorkspaceId={readChatWorkspaceId({
        servidor: searchParams.get("servidor") ?? undefined,
      })}
      initialConversationId={readChatConversationId(pathname)}
      nextPathname={pathname}
      nextSearch={searchParams.toString()}
    />
  );
}

/**
 * Encaixa a sessão do chat no frame (rail + sidebar + painel).
 * O provider guarda a aba; o frame só desenha.
 */
function ChatShellReady({
  workspaces,
  lists,
  currentUser,
  spacesWithoutServer,
  initialWorkspaceId,
  initialConversationId,
  nextPathname,
  nextSearch,
}: ChatShellProps & {
  initialWorkspaceId: string;
  initialConversationId?: number;
  nextPathname?: string;
  nextSearch?: string;
}) {
  return (
    <ChatSessionProvider
      initialRoute={{
        workspaceId: initialWorkspaceId,
        conversationId: initialConversationId,
      }}
      nextPathname={nextPathname}
      nextSearch={nextSearch}
    >
      <ChatShellFrame
        workspaces={workspaces}
        lists={lists}
        currentUser={currentUser}
        spacesWithoutServer={spacesWithoutServer}
      />
    </ChatSessionProvider>
  );
}

/**
 * Renderiza rail, sidebar e o painel a partir da sessão e das listas.
 * Recalcula seções quando a aba ou o servidor mudam, sem remontar avatares.
 */
function ChatShellFrame({
  workspaces,
  lists,
  currentUser,
  spacesWithoutServer,
}: Omit<ChatShellProps, "children">) {
  const { conversationId, workspaceId } = useChatSession();
  const currentWorkspace = useMemo(
    () =>
      resolveChatWorkspace({
        workspaces,
        requestedId: workspaceId,
        conversation: conversationId
          ? findListedConversation(lists, conversationId)
          : undefined,
      }),
    [workspaces, workspaceId, lists, conversationId],
  );
  const sections = useMemo(
    () => chatSidebarSections(lists, currentWorkspace),
    [lists, currentWorkspace],
  );
  const hideNavigationOnMobile = Boolean(conversationId);

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
          activeConversationId={conversationId}
          hiddenOnMobile={hideNavigationOnMobile}
        />
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <ChatMainPanel />
        </div>
      </div>
    </ChatShellContext.Provider>
  );
}
