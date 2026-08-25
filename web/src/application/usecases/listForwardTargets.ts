import type { ChatForwardTarget } from "@/domain/ChatForward";
import type { ChatRepository, ConversationLists } from "../ports/ChatRepository";

export async function listForwardTargets(chat: ChatRepository, token: string) {
  return mapForwardTargets(await chat.listConversations(token));
}

function mapForwardTargets(lists: ConversationLists): ChatForwardTarget[] {
  const channels = lists.channels
    .filter((channel) => channel.channelType !== "voice")
    .map((channel) => ({
      conversationId: channel.id,
      userId: null,
      name: channel.name,
      kind: "channel" as const,
      imageUrl: "",
      subtitle: channel.parentConversationId ? "Tópico" : "Canal",
    }));

  const dms = lists.dms.map((conversation) => {
    const contact = lists.contacts.find(
      (person) => person.conversationId === conversation.id,
    );

    return {
      conversationId: conversation.id,
      userId: contact?.userId ?? null,
      name: conversation.name,
      kind: "dm" as const,
      imageUrl: contact?.imageUrl ?? "",
      subtitle: "Mensagem direta",
    };
  });

  const contacts = lists.contacts
    .filter((contact) => !contact.conversationId)
    .map((contact) => ({
      conversationId: null,
      userId: contact.userId,
      name: contact.name,
      kind: "dm" as const,
      imageUrl: contact.imageUrl,
      subtitle: "Mensagem direta",
    }));

  return [...dms, ...contacts, ...channels];
}
