import type { Activity } from "@/domain/Activity";
import type { Comment, CommentLike, CommentPage } from "@/domain/Comment";
import type { MediaFile } from "@/domain/MediaFile";
import type { Post, PostLike } from "@/domain/Post";

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
  /** Página do fio (até 50 itens); `hasMore` diz se existe a próxima. */
  listComments(
    token: string,
    postId: number,
    page: number,
  ): Promise<CommentPage>;
  addComment(token: string, postId: number, message: string): Promise<Comment>;
  /** Alterna a curtida do post e devolve o novo estado. */
  togglePostLike(token: string, postId: number): Promise<PostLike>;
  /** Alterna a curtida do comentário e devolve o novo estado. */
  toggleCommentLike(token: string, commentId: number): Promise<CommentLike>;
}
