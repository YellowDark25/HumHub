import { errorMessage, isNotFound } from "@/application/errors";
import { Avatar } from "@/components/Avatar";
import { ChatConversationPane } from "@/components/ChatConversationPane";
import {
  ChatDirectCallBar,
  ChatDirectCallButton,
  ChatDirectCallStage,
} from "@/components/ChatDirectCall";
import { ChatDmIntro } from "@/components/ChatDmIntro";
import { ChatPeerProfilePreview } from "@/components/ChatPeerProfilePreview";
import { ChatServerHeaderActions } from "@/components/ChatServerHeaderActions";
import { ChatShell } from "@/components/ChatShell";
import { ChatTopicIcon } from "@/components/ChatTopicIcon";
import { ChatVoiceRoom } from "@/components/ChatVoiceRoom";
import { LoadError } from "@/components/LoadError";
import type { ChatMessage } from "@/domain/ChatMessage";
import type { ChatMutualServer } from "@/domain/ChatMutualServer";
import type { ChatNotificationPreference } from "@/domain/ChatNotificationPreference";
import type { ChatSidebarSection, ChatWorkspace } from "@/domain/ChatWorkspace";
import type { Conversation } from "@/domain/Conversation";
import type { Person } from "@/domain/Person";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { isChatTopic, topicParentId } from "@/shared/chatTopic";
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
  let channels: Conversation[] = [];
  let mutualServers: ChatMutualServer[] = [];
  let peerPerson: Person | null = null;
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
    channels = page.lists.channels;
    mutualServers = page.mutualServers ?? [];
    peerPerson = page.peer ?? null;
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

  const parentChannel = channels.find(
    (channel) => channel.id === current.parentConversationId,
  );
  const topicsConversationId = topicParentId(current);
  const topicsConversationName = parentChannel?.name ?? current.name;
  const isDirect = current.kind === "dm";
  const peer = sections
    .flatMap((section) => section.items)
    .find((item) => item.conversationId === conversationId);
  const headerActions = isDirect ? (
    <div className="flex items-center gap-0.5">
      <ChatDirectCallButton
        conversationId={conversationId}
        conversationName={current.name}
        workspaceId={currentWorkspace.id}
      />
      {peer?.userId ? (
        <ChatPeerProfilePreview
          name={current.name}
          username={peer.username}
          imageUrl={peer.imageUrl}
          userId={peer.userId}
          person={peerPerson}
          mutualServers={mutualServers}
          align="right"
        />
      ) : null}
    </div>
  ) : (
    <ChatServerHeaderActions
      conversationId={topicsConversationId}
      conversationName={topicsConversationName}
      workspaceId={currentWorkspace.id}
      notificationPreference={notificationPreference}
    />
  );

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
          workspaceId={currentWorkspace.id}
          conversationName={topicsConversationName}
          title={
            <>
              <Link
                href={chatWorkspaceHref(currentWorkspace.id)}
                className="text-sm font-medium text-teal-700 lg:hidden"
              >
                Voltar
              </Link>
              <ConversationTitle
                conversation={current}
                parentName={parentChannel?.name ?? null}
                imageUrl={isDirect ? peer?.imageUrl ?? "" : ""}
              />
            </>
          }
          trailing={headerActions}
          intro={
            isDirect ? (
              <ChatDmIntro
                name={current.name}
                username={peer?.username ?? ""}
                imageUrl={peer?.imageUrl ?? ""}
                userId={peer?.userId ?? null}
                mutualServers={mutualServers}
                peer={peerPerson}
              />
            ) : null
          }
          banner={
            isDirect ? (
              <ChatDirectCallBar
                conversationId={conversationId}
                conversationName={current.name}
                workspaceId={currentWorkspace.id}
                peerImageUrl={peer?.imageUrl ?? ""}
              />
            ) : null
          }
          overlay={
            isDirect ? (
              <ChatDirectCallStage
                conversationId={conversationId}
                conversationName={current.name}
              />
            ) : null
          }
          placeholder={
            isChatTopic(current)
              ? `Conversar em '${current.name}'`
              : current.kind === "channel"
                ? `Conversar em #${current.name}`
                : `Conversar em @${current.name}`
          }
          canManage={current.canManage}
          canCreateTopic={!isDirect}
          initialMessages={messages}
        />
      )}
    </ChatShell>
  );
}

function ConversationTitle({
  conversation,
  parentName,
  imageUrl,
}: {
  conversation: Conversation;
  parentName: string | null;
  imageUrl: string;
}) {
  if (parentName && isChatTopic(conversation)) {
    return (
      <h1 className="flex min-w-0 items-center gap-2 truncate">
        <span className="truncate text-zinc-500"># {parentName}</span>
        <span className="text-zinc-300" aria-hidden="true">
          ›
        </span>
        <ChatTopicIcon className="h-4 w-4 shrink-0 text-zinc-500" />
        <span className="truncate">{conversation.name}</span>
      </h1>
    );
  }

  if (conversation.kind === "dm") {
    return (
      <h1 className="flex min-w-0 items-center gap-2 truncate">
        <Avatar name={conversation.name} imageUrl={imageUrl} size="sm" shape="circle" />
        <span className="truncate">{conversation.name}</span>
      </h1>
    );
  }

  return (
    <h1 className="truncate">
      # {conversation.name}
    </h1>
  );
}
