import { ApplicationError } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

export function getPostFile(
  feed: FeedRepository,
  token: string,
  fileId: number,
) {
  if (!fileId) {
    throw new ApplicationError("Arquivo inválido.", 400);
  }

  return feed.getPostFile(token, fileId);
}
