import type { FeedRepository } from "../ports/FeedRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { loadSpaceMembers } from "./loadSpaceMembers";

export async function getSpacePage(
  token: string,
  spaceId: number,
  spaces: SpaceRepository,
  feed: FeedRepository,
) {
  const [space, posts, members] = await Promise.all([
    spaces.getById(token, spaceId),
    feed.listPosts(token, spaceId),
    loadSpaceMembers(spaces, token, spaceId),
  ]);

  return { space, posts, members };
}
