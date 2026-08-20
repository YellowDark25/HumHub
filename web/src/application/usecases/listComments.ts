import type { FeedRepository } from "../ports/FeedRepository";

export function listComments(
  feed: FeedRepository,
  token: string,
  postId: number,
) {
  return feed.listComments(token, postId);
}
