"use client";

import type { Conversation } from "@/domain/Conversation";
import type { ConversationView } from "@/domain/ConversationView";
import { isChatTopic, topicParentId } from "@/shared/chatTopic";
import { HOME_WORKSPACE_ID } from "@/domain/ChatWorkspace";
import { readApiError } from "@/shared/readApiError";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { ChatConversationPane } from "./ChatConversationPane";
import {
  ChatDirectCallBar,
  ChatDirectCallButton,
  ChatDirectCallStage,
} from "./ChatDirectCall";
import { ChatDmIntro } from "./ChatDmIntro";
import { ChatPeerProfilePreview } from "./ChatPeerProfilePreview";
import { ChatServerHeaderActions } from "./ChatServerHeaderActions";
import { ChatTopicIcon } from "./ChatTopicIcon";
import { ChatVoiceRoom } from "./ChatVoiceRoom";
import { LoadError } from "./LoadError";

/**
 * Painel da conversa ativa: busca GET /api/chat/conversation ao trocar de aba.
 * Mostra loading ou erro só no painel; a sidebar permanece montada.
 */
export function ChatConversationView({
  conversationId,
  workspaceId,
}: {
  conversationId: number;
  workspaceId: string;
}) {
  const [view, setView] = useState<ConversationView | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setView(null);
    setLoadError("");

    async function loadView() {
      try {
        const next = await fetchConversationView(conversationId, workspaceId);
        if (!cancelled) {
          setView(next);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar a conversa.",
          );
        }
      }
    }

    void loadView();
    return () => {
      cancelled = true;
    };
  }, [conversationId, workspaceId]);

  if (loadError) {
    return (
      <div className="p-4">
        <LoadError message={loadError} />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
        Carregando conversa…
      </div>
    );
  }

  return <ConversationPanel view={view} />;
}

/**
 * Monta voz ou mensagens a partir da ConversationView já carregada.
 * Recalcula título, intro e ações sem buscar de novo.
 */
function ConversationPanel({ view }: { view: ConversationView }) {
  const { conversation, currentUser } = view;
  const conversationId = conversation.id;
  const isDirect = conversation.kind === "dm";
  const topicsConversationId = topicParentId(conversation);
  const topicsConversationName = view.parentName ?? conversation.name;

  if (conversation.channelType === "voice") {
    return (
      <ChatVoiceRoom
        conversationId={conversationId}
        channelName={conversation.name}
        workspaceId={view.workspaceId}
        workspaceName={view.workspaceName}
        currentUser={currentUser}
        notificationPreference={view.notificationPreference}
      />
    );
  }

  return (
    <ChatConversationPane
      key={conversationId}
      conversationId={conversationId}
      currentUserId={currentUser.id}
      workspaceId={view.workspaceId}
      conversationName={topicsConversationName}
      title={
        <ConversationTitle
          conversation={conversation}
          parentName={view.parentName}
          imageUrl={isDirect ? view.peerImageUrl : ""}
        />
      }
      trailing={
        isDirect ? (
          <div className="flex items-center gap-0.5">
            <ChatDirectCallButton
              conversationId={conversationId}
              conversationName={conversation.name}
              workspaceId={view.workspaceId}
            />
            {view.peerUserId ? (
              <ChatPeerProfilePreview
                name={conversation.name}
                username={view.peerUsername}
                imageUrl={view.peerImageUrl}
                userId={view.peerUserId}
                person={view.peer}
                mutualServers={view.mutualServers}
                align="right"
              />
            ) : null}
          </div>
        ) : (
          <ChatServerHeaderActions
            conversationId={topicsConversationId}
            conversationName={topicsConversationName}
            workspaceId={view.workspaceId}
            notificationPreference={view.notificationPreference}
          />
        )
      }
      intro={
        isDirect ? (
          <ChatDmIntro
            name={conversation.name}
            username={view.peerUsername}
            imageUrl={view.peerImageUrl}
            userId={view.peerUserId}
            mutualServers={view.mutualServers}
            peer={view.peer}
          />
        ) : null
      }
      banner={
        isDirect ? (
          <ChatDirectCallBar
            conversationId={conversationId}
            conversationName={conversation.name}
            workspaceId={view.workspaceId}
            peerImageUrl={view.peerImageUrl}
          />
        ) : null
      }
      overlay={
        isDirect ? (
          <ChatDirectCallStage
            conversationId={conversationId}
            conversationName={conversation.name}
          />
        ) : null
      }
      placeholder={conversationPlaceholder(conversation)}
      canManage={conversation.canManage}
      canCreateTopic={!isDirect}
      membersConversationId={isDirect ? null : topicsConversationId}
      initialMessages={view.messages}
    />
  );
}

/**
 * Título do cabeçalho da conversa (DM, canal ou tópico).
 * No tópico mostra o canal pai; na DM, o avatar do peer.
 */
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

  return <h1 className="truncate"># {conversation.name}</h1>;
}

/**
 * Placeholder do compositor conforme o tipo da conversa.
 * Tópico, canal e DM usam prefixos diferentes.
 */
function conversationPlaceholder(conversation: Conversation) {
  if (isChatTopic(conversation)) {
    return `Conversar em '${conversation.name}'`;
  }

  if (conversation.kind === "channel") {
    return `Conversar em #${conversation.name}`;
  }

  return `Conversar em @${conversation.name}`;
}

/**
 * Busca o painel da conversa em GET /api/chat/conversation.
 * Em falha, lança Error com a mensagem da API.
 */
async function fetchConversationView(
  conversationId: number,
  workspaceId: string,
): Promise<ConversationView> {
  const params = new URLSearchParams({ id: String(conversationId) });
  if (workspaceId !== HOME_WORKSPACE_ID) {
    params.set("servidor", workspaceId);
  }

  const response = await fetch(`/api/chat/conversation?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível carregar a conversa."),
    );
  }

  return (await response.json()) as ConversationView;
}
