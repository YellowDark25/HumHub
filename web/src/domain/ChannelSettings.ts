import type { Conversation } from "./Conversation";

export type ChannelMember = {
  userId: number;
  name: string;
  isAdmin: boolean;
};

export type ChannelInvitee = {
  userId: number;
  name: string;
  username: string;
  imageUrl: string;
};

export type ChannelSettings = {
  conversation: Conversation;
  members: ChannelMember[];
  pendingInvites: ChannelMember[];
  invitableUsers: ChannelInvitee[];
};
