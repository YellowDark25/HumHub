import type { Activity } from "@/domain/Activity";
import type { Comment } from "@/domain/Comment";
import type { Post } from "@/domain/Post";

export interface FeedRepository {
  listPosts(token: string, spaceId?: number): Promise<Post[]>;
  publishPost(token: string, spaceId: number, message: string): Promise<Post>;
  listActivities(token: string, spaceId?: number): Promise<Activity[]>;
  listComments(token: string, postId: number): Promise<Comment[]>;
  addComment(token: string, postId: number, message: string): Promise<Comment>;
}
