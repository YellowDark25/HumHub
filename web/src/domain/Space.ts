export type SpaceVisibility = "public" | "private";

export type Space = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  bannerUrl: string;
  postCount: number;
  memberCount: number;
  followerCount: number;
  visibility: SpaceVisibility;
  isMember: boolean;
  isFollowing: boolean;
  isInvited: boolean;
};

export type CreateSpaceInput = {
  name: string;
  description: string;
  visibility: SpaceVisibility;
};
