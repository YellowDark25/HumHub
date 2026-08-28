/** Comentário de uma publicação: autor, texto, data e curtidas. */
export type Comment = {
  id: number;
  authorName: string;
  authorImageUrl: string;
  message: string;
  publishedAt: string | null;
  likeCount: number;
  liked: boolean;
};

/**
 * Estado da curtida do comentário depois de um clique.
 */
export type CommentLike = {
  liked: boolean;
  likeCount: number;
};

/**
 * Página de comentários do fio.
 * `hasMore` indica se ainda há outra leva depois desta.
 */
export type CommentPage = {
  comments: Comment[];
  page: number;
  hasMore: boolean;
};
