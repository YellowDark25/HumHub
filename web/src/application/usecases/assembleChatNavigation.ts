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

function homeWorkspace(): ChatWorkspace {
  return {
    id: HOME_WORKSPACE_ID,
    kind: "home",
    name: "Mensagens diretas",
    imageUrl: "",
    spaceId: null,
  };
}

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

    sections.push({
      title: "Mensagens diretas",
      items:
        lists.contacts.length > 0
          ? contactItems(lists.contacts)
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
    children: [],
  }));
}
