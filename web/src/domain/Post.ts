import type { Comment } from "./Comment";
import type { PostAttachment } from "./PostAttachment";

export type Post = {
  id: number;
  spaceId: number | null;
  spaceName: string | null;
  authorId: number | null;
  authorName: string;
  authorImageUrl: string;
  message: string;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
  latestComments: Comment[];
  attachments: PostAttachment[];
};
