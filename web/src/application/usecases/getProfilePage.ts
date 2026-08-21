import type { Post } from "@/domain/Post";
import type { ReceivedSpaceInvite } from "@/domain/SpaceInvite";
import { isUnauthorized } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { FeedRepository } from "../ports/FeedRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";

export async function getProfilePage(
  token: string,
  auth: AuthRepository,
  feed: FeedRepository,
  spaces: SpaceRepository,
) {
  const sessionUser = await auth.getCurrentUser(token);
  const [posts, spaceList, invites] = await Promise.all([
    feed.listPosts(token),
    spaces.list(token),
    loadReceivedInvites(spaces, token),
  ]);

  return {
    user: { ...sessionUser, isOnline: true },
    posts: postsByAuthor(posts, sessionUser.id),
    spaces: spaceList,
    invites,
  };
}

async function loadReceivedInvites(
  spaces: SpaceRepository,
  token: string,
): Promise<ReceivedSpaceInvite[]> {
  try {
    return await spaces.listReceivedInvites(token);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao carregar convites do perfil: ${error instanceof Error ? error.message : "erro desconhecido"}`,
    );
    return [];
  }
}

function postsByAuthor(posts: Post[], userId: number): Post[] {
  return posts.filter((post) => post.authorId === userId);
}
