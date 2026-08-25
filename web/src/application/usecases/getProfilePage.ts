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
  const [posts, spaceList, invites, friendCount] = await Promise.all([
    feed.listPosts(token),
    spaces.list(token),
    loadReceivedInvites(spaces, token),
    loadFriendCount(auth, token, sessionUser.id),
  ]);

  return {
    user: { ...sessionUser, isOnline: true },
    posts: postsByAuthor(posts, sessionUser.id),
    spaces: spaceList,
    invites,
    friendCount,
  };
}

async function loadFriendCount(
  auth: AuthRepository,
  token: string,
  userId: number,
): Promise<number> {
  try {
    const person = await auth.getPerson(token, userId);
    return person.friendCount;
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao carregar a quantidade de amigos: ${error instanceof Error ? error.message : "erro desconhecido"}`,
    );
    return 0;
  }
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
