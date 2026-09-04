"use client";

import type {
  ChatSidebarItem,
  ChatSidebarSection,
  ChatWorkspace,
} from "@/domain/ChatWorkspace";
import { ChatChannelItem } from "./ChatChannelItem";
import { ChatContactButton } from "./ChatContactButton";
import { ChatCreateChannelButton } from "./ChatCreateChannelButton";
import { ChatEventsNav } from "./ChatEventsNav";
import { ChatPaneHeader } from "./ChatPaneHeader";
import { ChatPersonRow } from "./ChatPersonRow";
import { useChatSession } from "./ChatSession";
import { ChatTabLink } from "./ChatTabLink";
import { ChatUnreadBadge } from "./ChatUnreadBadge";
import { useChatUnreadCounts } from "./ChatUnread";
import { ChatVoiceConnectionBar } from "./ChatVoiceConnectionBar";
import { useVoiceOccupancy } from "./ChatVoiceOccupancy";

type ChatChannelSidebarProps = {
  workspace: ChatWorkspace;
  sections: ChatSidebarSection[];
  activeConversationId?: number;
};

/**
 * Sidebar de canais, DMs e atalhos do servidor.
 * No espaço, Eventos fica acima dos canais; o divisor não encosta nas bordas.
 */
export function ChatChannelSidebar({
  workspace,
  sections,
  activeConversationId,
}: ChatChannelSidebarProps) {
  const isHome = workspace.kind === "home";

  return (
    <aside className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-50 lg:border-r lg:border-zinc-200">
      <ChatPaneHeader title={<p className="truncate">{workspace.name}</p>} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {workspace.kind === "space" && workspace.spaceId ? (
          <div className="shrink-0 px-2 pt-2">
            <ChatEventsNav
              spaceId={workspace.spaceId}
              voiceChannels={voiceChannelsFrom(sections)}
            />
          </div>
        ) : null}
        {workspace.kind === "space" ? (
          <div className="mx-3.5 my-1.5 border-t border-zinc-200" />
        ) : null}
        <div
          className={`flex flex-1 flex-col ${
            isHome ? "gap-1.5 p-2.5" : "gap-6 py-3"
          }`}
        >
          {sections.map((section) => (
            <SidebarSection
              key={section.title}
              section={section}
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              spaceId={workspace.spaceId}
              hideTitle={isHome && section.title === workspace.name}
              activeConversationId={activeConversationId}
            />
          ))}
        </div>
      </div>
      <ChatVoiceConnectionBar />
    </aside>
  );
}

function SidebarSection({
  section,
  workspaceId,
  workspaceName,
  spaceId,
  hideTitle,
  activeConversationId,
}: {
  section: ChatSidebarSection;
  workspaceId: string;
  workspaceName: string;
  spaceId: number | null;
  hideTitle: boolean;
  activeConversationId?: number;
}) {
  const canCreate = Boolean(section.createChannelType);

  return (
    <section>
      {hideTitle ? null : (
        <h2 className="mb-2.5 flex items-center justify-between gap-2 px-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>{section.title}</span>
          {section.createChannelType ? (
            <ChatCreateChannelButton
              workspaceId={workspaceId}
              spaceId={spaceId}
              categoryName={section.title}
              defaultType={section.createChannelType}
            />
          ) : null}
        </h2>
      )}
      {section.items.length === 0 && !canCreate ? (
        <p className="px-2 text-sm text-zinc-400">Nenhum item.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {section.items.map((item) => (
            <li key={item.key}>
              <SidebarItem
                item={item}
                workspaceId={workspaceId}
                workspaceName={workspaceName}
                categoryName={section.title}
                isActive={item.conversationId === activeConversationId}
                activeConversationId={activeConversationId}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SidebarItem({
  item,
  workspaceId,
  workspaceName,
  categoryName,
  isActive,
  activeConversationId,
}: {
  item: ChatSidebarItem;
  workspaceId: string;
  workspaceName: string;
  categoryName: string;
  isActive: boolean;
  activeConversationId?: number;
}) {
  if (isPersonItem(item)) {
    if (!item.conversationId && item.userId) {
      return (
        <ChatContactButton
          userId={item.userId}
          name={item.name}
          imageUrl={item.imageUrl}
          subtitle={item.subtitle}
          isOnline={item.isOnline}
          isSecretary={item.isSecretary}
        />
      );
    }

    if (item.conversationId) {
      return (
        <DirectMessageLink
          conversationId={item.conversationId}
          name={item.name}
          imageUrl={item.imageUrl}
          subtitle={item.subtitle}
          isOnline={item.isOnline}
          workspaceId={workspaceId}
          isActive={isActive}
        />
      );
    }
  }

  return (
    <ChatChannelItem
      item={item}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      categoryName={categoryName}
      isActive={isActive}
      activeConversationId={activeConversationId}
    />
  );
}

/**
 * Link de uma DM na sidebar; troca só o painel, sem scroll da página.
 * Marca "Em chamada" quando há ocupantes e o badge quando há não lidas.
 */
function DirectMessageLink({
  conversationId,
  name,
  imageUrl,
  subtitle,
  isOnline,
  workspaceId,
  isActive,
}: {
  conversationId: number;
  name: string;
  imageUrl: string;
  subtitle: string;
  isOnline: boolean;
  workspaceId: string;
  isActive: boolean;
}) {
  const { openConversation } = useChatSession();
  const { occupantsByChannel } = useVoiceOccupancy();
  const { unreadOf } = useChatUnreadCounts();
  const occupants = occupantsByChannel[conversationId] ?? [];
  const unreadCount = unreadOf(conversationId);

  return (
    <ChatTabLink
      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left ${
        isActive
          ? "bg-zinc-200"
          : unreadCount > 0
            ? "hover:bg-zinc-200/70"
            : "hover:bg-zinc-200/70"
      }`}
      onOpen={() => openConversation(conversationId, workspaceId)}
    >
      <ChatPersonRow
        name={name}
        imageUrl={imageUrl}
        subtitle={occupants.length > 0 ? "Em chamada" : subtitle}
        isOnline={isOnline}
      />
      <ChatUnreadBadge count={unreadCount} />
    </ChatTabLink>
  );
}

function isPersonItem(item: ChatSidebarItem) {
  return item.kind === "dm" || item.kind === "contact" || item.kind === "invite";
}

/**
 * Extrai os canais de voz do sidebar para o assistente de eventos.
 * Ignora itens sem conversa (só nome).
 */
function voiceChannelsFrom(sections: ChatSidebarSection[]) {
  return sections
    .filter((section) => section.createChannelType === "voice")
    .flatMap((section) => section.items)
    .flatMap((item) => [item, ...item.children])
    .filter(
      (item): item is ChatSidebarItem & { conversationId: number } =>
        item.conversationId !== null && item.channelType === "voice",
    )
    .map((item) => ({
      id: item.conversationId,
      name: item.name,
    }));
}

