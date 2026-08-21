import type { Post } from "@/domain/Post";
import type { User } from "@/domain/User";
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
  const [user, posts, spaceList] = await Promise.all([
    loadProfileUser(auth, token, sessionUser),
    feed.listPosts(token),
    spaces.list(token),
  ]);

  return {
    user,
    posts: postsByAuthor(posts, user.id),
    spaces: spaceList,
  };
}

async function loadProfileUser(
  auth: AuthRepository,
  token: string,
  sessionUser: User,
): Promise<User> {
  try {
    const profile = await auth.getUser(token, sessionUser.id);
    return { ...profile, isAdmin: sessionUser.isAdmin, isOnline: true };
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao carregar o perfil completo: ${error instanceof Error ? error.message : "erro desconhecido"}`,
    );
    return { ...sessionUser, isOnline: true };
  }
}

function postsByAuthor(posts: Post[], userId: number): Post[] {
  return posts.filter((post) => post.authorId === userId);
}
