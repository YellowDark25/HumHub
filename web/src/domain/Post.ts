import type { Comment } from "./Comment";
import type { PostAttachment } from "./PostAttachment";

/** Publicação do feed: autor, texto, anexos e totais de curtida/comentário. */
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
  liked: boolean;
  commentCount: number;
  latestComments: Comment[];
  attachments: PostAttachment[];
};

/**
 * Estado da curtida depois de um clique.
 * O fio do feed atualiza só esses campos, sem recarregar o post inteiro.
 */
export type PostLike = {
  liked: boolean;
  likeCount: number;
};
