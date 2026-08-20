import type { ChatMessage } from "@/domain/ChatMessage";
import type { Conversation } from "@/domain/Conversation";

export type ConversationLists = {
  channels: Conversation[];
  dms: Conversation[];
  pendingInvites: Conversation[];
};

export interface ChatRepository {
  listConversations(token: string): Promise<ConversationLists>;
  listMessages(token: string, conversationId: number): Promise<ChatMessage[]>;
  sendMessage(
    token: string,
    conversationId: number,
    content: string,
  ): Promise<ChatMessage>;
}
