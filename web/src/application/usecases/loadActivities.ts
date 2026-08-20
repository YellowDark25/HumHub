import type { Activity } from "@/domain/Activity";
import { isUnauthorized } from "../errors";
import type { FeedRepository } from "../ports/FeedRepository";

export async function loadActivities(
  feed: FeedRepository,
  token: string,
  spaceId?: number,
): Promise<Activity[]> {
  try {
    return await feed.listActivities(token, spaceId);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao carregar atividades: ${error instanceof Error ? error.message : "erro desconhecido"}`,
    );
    return [];
  }
}
