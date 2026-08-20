import type { Activity } from "@/domain/Activity";
import { isUnauthorized } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";

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

async function loadActivities(
  feed: FeedRepository,
  token: string,
): Promise<Activity[]> {
  try {
    return await feed.listActivities(token);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao carregar atividades do feed: ${error instanceof Error ? error.message : "erro desconhecido"}`,
    );
    return [];
  }
}
