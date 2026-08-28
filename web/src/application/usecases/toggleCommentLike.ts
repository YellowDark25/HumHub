import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

/**
 * Alterna a curtida do comentário (curtir ou retirar).
 * Valida o comentário e grava pelo repositório do feed.
 */
export function toggleCommentLike(
  feed: FeedRepository,
  token: string,
  commentId: number,
) {
  if (!commentId) {
    throw new ApplicationError("Comentário inválido.", 400);
  }

  return feed.toggleCommentLike(token, commentId);
}
