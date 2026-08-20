import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

export function addComment(
  feed: FeedRepository,
  token: string,
  postId: number,
  message: string,
) {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new ApplicationError("O comentário não pode ficar vazio.", 400);
  }

  if (!postId) {
    throw new ApplicationError("Publicação inválida.", 400);
  }

  return feed.addComment(token, postId, trimmed);
}
