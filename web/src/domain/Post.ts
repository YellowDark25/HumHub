import type { Comment } from "./Comment";

export type Post = {
  id: number;
  spaceId: number | null;
  spaceName: string | null;
  authorName: string;
  message: string;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
  latestComments: Comment[];
};
