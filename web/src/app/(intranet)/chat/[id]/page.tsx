import { errorMessage, isNotFound } from "@/application/errors";
import { ChatConversationPane } from "@/components/ChatConversationPane";
import { ChatServerNotificationMenu } from "@/components/ChatServerNotificationMenu";
import { ChatShell } from "@/components/ChatShell";
import { ChatVoiceRoom } from "@/components/ChatVoiceRoom";
import { LoadError } from "@/components/LoadError";
import type { ChatMessage } from "@/domain/ChatMessage";
import type { ChatNotificationPreference } from "@/domain/ChatNotificationPreference";
import type { ChatSidebarSection, ChatWorkspace } from "@/domain/ChatWorkspace";
import type { Conversation } from "@/domain/Conversation";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { chatWorkspaceHref, readChatWorkspaceId } from "@/shared/chatWorkspace";
import Link from "next/link";
import { notFound } from "next/navigation";

type ChatViewProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChatViewPage({
  params,
  searchParams,
}: ChatViewProps) {
  const { id } = await params;
  const conversationId = Number(id);
  const workspaceId = readChatWorkspaceId(await searchParams);
  const token = await requirePageToken();

  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    notFound();
  }

  let current: Conversation | undefined;
  let workspaces: ChatWorkspace[] = [];
  let currentWorkspace: ChatWorkspace | null = null;
  let sections: ChatSidebarSection[] = [];
  let currentUser: User | null = null;
  let spacesWithoutServer: Space[] = [];
  let notificationPreference: ChatNotificationPreference | null = null;
  let messages: ChatMessage[] = [];
  let loadError = "";

  try {
    const page = await app.getConversationPage(
      token,
      conversationId,
      workspaceId,
    );
    current = page.current;
    workspaces = page.workspaces;
    currentWorkspace = page.currentWorkspace;
    sections = page.sections;
    currentUser = page.currentUser;
    spacesWithoutServer = page.spacesWithoutServer;
    notificationPreference = page.notificationPreference;
    messages = page.messages;
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar a conversa.");
  }

  if (!current || !currentWorkspace) {
    if (loadError) {
      return (
        <main>
          <LoadError message={loadError} />
        </main>
      );
    }
    notFound();
  }

  return (
    <ChatShell
      workspaces={workspaces}
      currentWorkspace={currentWorkspace}
      sections={sections}
      currentUser={currentUser}
      spacesWithoutServer={spacesWithoutServer}
      activeConversationId={conversationId}
      hideNavigationOnMobile
    >
      {current.channelType === "voice" && currentUser ? (
        <ChatVoiceRoom
          conversationId={conversationId}
          channelName={current.name}
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          currentUser={currentUser}
          notificationPreference={notificationPreference}
        />
      ) : (
        <ChatConversationPane
          key={conversationId}
          conversationId={conversationId}
          currentUserId={currentUser?.id ?? 0}
          title={
            <>
              <Link
                href={chatWorkspaceHref(currentWorkspace.id)}
                className="text-sm font-medium text-teal-700 lg:hidden"
              >
                Voltar
              </Link>
              <h1 className="truncate">
                {current.kind === "channel" ? "#" : "@"} {current.name}
              </h1>
            </>
          }
          trailing={
            notificationPreference ? (
              <ChatServerNotificationMenu
                initialPreference={notificationPreference}
              />
            ) : null
          }
          placeholder={
            current.kind === "channel"
              ? `Conversar em #${current.name}`
              : `Conversar em @${current.name}`
          }
          initialMessages={messages}
        />
      )}
    </ChatShell>
  );
}
