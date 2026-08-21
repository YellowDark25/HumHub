export type SpaceInvitee = {
  id: number;
  name: string;
  username: string;
  imageUrl: string;
};

export type SpaceInviteInput = {
  userIds: number[];
  selectAllRegistered: boolean;
  addWithoutInvite: boolean;
  addAsDefaultSpace: boolean;
};

export type ReceivedSpaceInvite = {
  spaceId: number;
  spaceName: string;
  spaceImageUrl: string;
  invitedByName: string;
};
