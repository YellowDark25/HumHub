import type { Activity } from "@/domain/Activity";
import type { Comment } from "@/domain/Comment";
import type { MediaFile } from "@/domain/MediaFile";
import type { Post } from "@/domain/Post";

/**
 * Porta do feed: publicações, anexos, comentários e atividades.
 * Os casos de uso falam só com esta interface; o HumHub fica na infra.
 */
export interface FeedRepository {
  listPosts(token: string, spaceId?: number): Promise<Post[]>;
  publishPost(
    token: string,
    spaceId: number,
    message: string,
    files?: File[],
  ): Promise<Post>;
  getPostFile(token: string, fileId: number): Promise<MediaFile>;
  /** Apaga a publicação no HumHub; os anexos saem junto. */
  deletePost(token: string, postId: number): Promise<void>;
  listActivities(token: string, spaceId?: number): Promise<Activity[]>;
  listComments(token: string, postId: number): Promise<Comment[]>;
  addComment(token: string, postId: number, message: string): Promise<Comment>;
}
