export type ConversationKind = "channel" | "dm" | "invite";

export type ChatChannelType = "text" | "voice" | "forum";

export type Conversation = {
  id: number;
  kind: ConversationKind;
  name: string;
  spaceId: number | null;
  parentConversationId: number | null;
  channelType: ChatChannelType | null;
  isPrivate: boolean;
  topic: string;
  slowModeSeconds: number;
  canManage: boolean;
};

export function canJoinVoice(
  conversation: Pick<Conversation, "kind" | "channelType">,
) {
  return conversation.kind === "dm" || conversation.channelType === "voice";
}
