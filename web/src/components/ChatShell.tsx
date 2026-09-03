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
import { ChatUnreadProvider } from "./ChatUnread";
import { ChatUserPanel } from "./ChatUserPanel";

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
 * O rail fica de fora; canais e mensagens formam o painel arredondado.
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
      <ChatUnreadProvider
        lists={lists}
        workspaces={workspaces}
        activeConversationId={conversationId}
      >
        <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-zinc-100">
          <ChatServerRail
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspace.id}
            currentUser={currentUser}
            spacesWithoutServer={spacesWithoutServer}
            hiddenOnMobile={hideNavigationOnMobile}
          />
          <div className="flex min-h-0 min-w-0 flex-1 p-2 lg:pl-0">
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl bg-white">
              <div
                className={`${
                  hideNavigationOnMobile ? "hidden lg:flex" : "flex"
                } min-h-0 w-full shrink-0 flex-col lg:w-72`}
              >
                <ChatChannelSidebar
                  workspace={currentWorkspace}
                  sections={sections}
                  activeConversationId={conversationId}
                />
                {currentUser ? <ChatUserPanel user={currentUser} /> : null}
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <ChatMainPanel />
              </div>
            </div>
          </div>
        </div>
      </ChatUnreadProvider>
    </ChatShellContext.Provider>
  );
}
