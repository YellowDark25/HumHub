import type { ChatContact } from "@/domain/ChatContact";
import type { Conversation } from "@/domain/Conversation";
import {
  CHANNELS_WORKSPACE_ID,
  HOME_WORKSPACE_ID,
  type ChatSidebarItem,
  type ChatSidebarSection,
  type ChatWorkspace,
} from "@/domain/ChatWorkspace";
import type { Space } from "@/domain/Space";
import type { ConversationLists } from "../ports/ChatRepository";

/**
 * Monta workspaces, seções e o servidor atual a partir das listas do chat.
 * Resolve o workspace pedido (ou o da conversa) e filtra as seções da sidebar.
 */
export function assembleChatNavigation(
  lists: ConversationLists,
  spaces: Space[],
  requestedId: string,
  conversation?: Conversation,
) {
  const workspaces = buildChatWorkspaces(spaces, lists.spaceServerIds);
  const currentWorkspace = resolveChatWorkspace({
    workspaces,
    requestedId,
    conversation,
  });

  return {
    lists,
    workspaces,
    currentWorkspace,
    spacesWithoutServer: spaces.filter(
      (space) => !lists.spaceServerIds.includes(space.id),
    ),
    sections: chatSidebarSections(lists, currentWorkspace),
  };
}

/**
 * Localiza a conversa nas listas já carregadas (canais, DMs e convites).
 * Percorre os três grupos e devolve o primeiro id correspondente.
 */
export function findListedConversation(
  lists: ConversationLists,
  conversationId: number,
) {
  return listedConversations(lists).find((item) => item.id === conversationId);
}

/**
 * Junta canais, DMs e convites numa lista plana.
 * Usada para localizar conversa e somar não lidas por servidor.
 */
export function listedConversations(lists: ConversationLists): Conversation[] {
  return [...lists.channels, ...lists.dms, ...lists.pendingInvites];
}

/**
 * Soma as não lidas de cada workspace (home = DMs; servidor = canais dele).
 * Percorre as conversas do workspace e acumula o contador já calculado.
 */
export function unreadCountByWorkspace(
  lists: ConversationLists,
  workspaces: ChatWorkspace[],
  unreadByConversation: Record<number, number>,
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const workspace of workspaces) {
    const ids =
      workspace.kind === "home"
        ? homeUnreadConversationIds(lists)
        : conversationsForWorkspace(lists, workspace).map(
            (conversation) => conversation.id,
          );
    totals[workspace.id] = ids.reduce(
      (total, conversationId) =>
        total + (unreadByConversation[conversationId] ?? 0),
      0,
    );
  }

  return totals;
}

function homeWorkspace(): ChatWorkspace {
  return {
    id: HOME_WORKSPACE_ID,
    kind: "home",
    name: "Mensagens diretas",
    imageUrl: "",
    spaceId: null,
  };
}

/**
 * Monta a lista de workspaces (home + servidores com chat ativo).
 * Sem servidores, inclui o atalho de canais soltos.
 */
export function buildChatWorkspaces(
  spaces: Space[],
  spaceServerIds: number[],
): ChatWorkspace[] {
  const home = homeWorkspace();
  const servers = spaces.filter((space) => spaceServerIds.includes(space.id));

  if (servers.length === 0) {
    return [
      home,
      {
        id: CHANNELS_WORKSPACE_ID,
        kind: "channels",
        name: "Canais",
        imageUrl: "",
        spaceId: null,
      },
    ];
  }

  return [
    home,
    ...servers.map((space) => ({
      id: String(space.id),
      kind: "space" as const,
      name: space.name,
      imageUrl: space.imageUrl,
      spaceId: space.id,
    })),
  ];
}

/**
 * Escolhe o workspace visível a partir da URL e, se houver, da conversa.
 * DM/convite forçam a home; canal usa o servidor pedido ou o primeiro.
 */
export function resolveChatWorkspace(input: {
  workspaces: ChatWorkspace[];
  requestedId: string;
  conversation?: Conversation;
}): ChatWorkspace {
  const home = input.workspaces[0] ?? homeWorkspace();

  const requested = input.workspaces.find(
    (workspace) => workspace.id === input.requestedId,
  );
  const firstServer =
    input.workspaces.find((workspace) => workspace.kind !== "home") ?? home;

  if (input.conversation?.kind === "dm" || input.conversation?.kind === "invite") {
    return home;
  }

  if (input.conversation?.kind === "channel") {
    if (requested && requested.kind !== "home") {
      return requested;
    }

    return firstServer;
  }

  return requested ?? home;
}

/**
 * Monta as seções da sidebar do workspace atual.
 * Na home lista secretária, convites e DMs; no servidor, canais de texto e voz.
 */
export function chatSidebarSections(
  lists: ConversationLists,
  workspace: ChatWorkspace,
): ChatSidebarSection[] {
  if (workspace.kind === "home") {
    const sections: ChatSidebarSection[] = [];

    if (lists.pendingInvites.length > 0) {
      sections.push({
        title: "Convites",
        items: conversationItems(lists.pendingInvites),
      });
    }

    const secretary = lists.contacts.filter((contact) => contact.isSecretary);
    const others = lists.contacts.filter((contact) => !contact.isSecretary);

    if (secretary.length > 0) {
      sections.push({
        title: "Secretária",
        items: contactItems(secretary),
      });
    }

    sections.push({
      title: "Mensagens diretas",
      items:
        others.length > 0
          ? contactItems(others)
          : lists.contacts.length > 0
            ? []
            : conversationItems(lists.dms),
    });
    return sections;
  }

  const channels = channelsForWorkspace(lists.channels, workspace);
  const topLevel = channels.filter((channel) => !channel.parentConversationId);
  const childrenByParent = topicsByParent(channels);

  return [
    {
      title: "Canais de texto",
      createChannelType: "text",
      items: conversationItems(
        topLevel.filter((channel) => channel.channelType !== "voice"),
        childrenByParent,
      ),
    },
    {
      title: "Canais de voz",
      createChannelType: "voice",
      items: conversationItems(
        topLevel.filter((channel) => channel.channelType === "voice"),
        childrenByParent,
      ),
    },
  ];
}

function topicsByParent(channels: Conversation[]) {
  const childrenByParent = new Map<number, Conversation[]>();

  for (const channel of channels) {
    if (!channel.parentConversationId) {
      continue;
    }

    const siblings = childrenByParent.get(channel.parentConversationId) ?? [];
    siblings.push(channel);
    childrenByParent.set(channel.parentConversationId, siblings);
  }

  return childrenByParent;
}

function conversationsForWorkspace(
  lists: ConversationLists,
  workspace: ChatWorkspace,
): Conversation[] {
  if (workspace.kind === "home") {
    return [...lists.dms, ...lists.pendingInvites];
  }

  return channelsForWorkspace(lists.channels, workspace);
}

/**
 * Ids de conversa que entram no badge da home (DMs, convites e contatos).
 * Contatos com DM aberta às vezes não vêm de novo em `lists.dms`.
 */
export function homeUnreadConversationIds(lists: ConversationLists): number[] {
  const ids = new Set<number>();
  for (const conversation of [...lists.dms, ...lists.pendingInvites]) {
    ids.add(conversation.id);
  }
  for (const contact of lists.contacts) {
    if (contact.conversationId) {
      ids.add(contact.conversationId);
    }
  }
  return [...ids];
}

function channelsForWorkspace(
  channels: Conversation[],
  workspace: ChatWorkspace,
): Conversation[] {
  if (workspace.kind === "channels" || workspace.spaceId === null) {
    return channels;
  }

  return channels.filter((channel) => channel.spaceId === workspace.spaceId);
}

function conversationItems(
  conversations: Conversation[],
  childrenByParent: Map<number, Conversation[]> = new Map(),
): ChatSidebarItem[] {
  return conversations.map((conversation) => ({
    key: `${conversation.kind}-${conversation.id}`,
    name: conversation.name,
    username: "",
    kind: conversation.kind,
    conversationId: conversation.id,
    parentConversationId: conversation.parentConversationId,
    userId: null,
    imageUrl: "",
    subtitle: "",
    isOnline: false,
    channelType: conversation.channelType,
    canManage: conversation.canManage,
    isSecretary: false,
    children: conversationItems(childrenByParent.get(conversation.id) ?? []),
  }));
}

function contactItems(contacts: ChatContact[]): ChatSidebarItem[] {
  return contacts.map((contact) => ({
    key: `contact-${contact.userId}`,
    name: contact.name,
    username: contact.username,
    kind: contact.conversationId ? "dm" : "contact",
    conversationId: contact.conversationId,
    parentConversationId: null,
    userId: contact.userId,
    imageUrl: contact.imageUrl,
    subtitle: contact.subtitle,
    isOnline: contact.isOnline,
    channelType: null,
    canManage: false,
    isSecretary: contact.isSecretary,
    children: [],
  }));
}
