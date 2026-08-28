import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

/**
 * Alterna a curtida da publicação (curtir ou retirar).
 * Valida o post e grava pelo repositório do feed.
 */
export function togglePostLike(
  feed: FeedRepository,
  token: string,
  postId: number,
) {
  if (!postId) {
    throw new ApplicationError("Publicação inválida.", 400);
  }

  return feed.togglePostLike(token, postId);
}
