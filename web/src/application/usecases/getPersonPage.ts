import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { FeedRepository } from "../ports/FeedRepository";

export async function getPersonPage(
  auth: AuthRepository,
  feed: FeedRepository,
  token: string,
  userId: number,
) {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ApplicationError("Pessoa inválida.", 400);
  }

  const [user, posts] = await Promise.all([
    auth.getPerson(token, userId),
    feed.listPosts(token),
  ]);

  return {
    user,
    posts: posts.filter((post) => post.authorId === user.id),
  };
}
