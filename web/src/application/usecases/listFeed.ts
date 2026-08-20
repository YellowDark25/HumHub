import type { FeedRepository } from "../ports/FeedRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { loadActivities } from "./loadActivities";

export async function listFeed(
  token: string,
  feed: FeedRepository,
  spaces: SpaceRepository,
) {
  const [posts, spaceList] = await Promise.all([
    feed.listPosts(token),
    spaces.list(token),
  ]);

  return {
    posts,
    spaces: spaceList,
    activities: await loadActivities(feed, token),
  };
}
