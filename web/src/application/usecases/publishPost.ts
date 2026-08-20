import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

export function publishPost(
  feed: FeedRepository,
  token: string,
  spaceId: number,
  message: string,
) {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new ApplicationError("A publicação não pode ficar vazia.", 400);
  }

  if (!spaceId) {
    throw new ApplicationError("Selecione um espaço.", 400);
  }

  return feed.publishPost(token, spaceId, trimmed);
}
