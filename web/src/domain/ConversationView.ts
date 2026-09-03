import type { ChatMessage } from "./ChatMessage";
import type { ChatMutualServer } from "./ChatMutualServer";
import type { ChatNotificationPreference } from "./ChatNotificationPreference";
import type { Conversation } from "./Conversation";
import type { Person } from "./Person";
import type { User } from "./User";

/**
 * Dados do painel de uma conversa (mensagens, peer e metadados do workspace).
 * O cliente pede isso ao trocar de aba; a sidebar não entra neste contrato.
 */
export type ConversationView = {
  conversation: Conversation;
  currentUser: User;
  messages: ChatMessage[];
  notificationPreference: ChatNotificationPreference | null;
  mutualServers: ChatMutualServer[];
  peer: Person | null;
  workspaceId: string;
  workspaceName: string;
  parentName: string | null;
  peerUserId: number | null;
  peerUsername: string;
  peerImageUrl: string;
};
