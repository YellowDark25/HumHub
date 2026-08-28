import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

/**
 * Lista uma página de comentários da publicação.
 * Valida o post e a página (≥ 1) e lê o fio pelo repositório do feed.
 */
export function listComments(
  feed: FeedRepository,
  token: string,
  postId: number,
  page = 1,
) {
  if (!postId) {
    throw new ApplicationError("Publicação inválida.", 400);
  }

  const currentPage = Math.trunc(page);
  if (!Number.isFinite(currentPage) || currentPage < 1) {
    throw new ApplicationError("Página inválida.", 400);
  }

  return feed.listComments(token, postId, currentPage);
}
