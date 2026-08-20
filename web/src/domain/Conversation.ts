export type ConversationKind = "channel" | "dm" | "invite";

export type Conversation = {
  id: number;
  kind: ConversationKind;
  name: string;
};
