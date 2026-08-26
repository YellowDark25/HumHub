import type { Post } from "@/domain/Post";
import { ApplicationError, errorMessage, isUnauthorized } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { FeedRepository } from "../ports/FeedRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { canManageSpace } from "./canManageSpace";
import { loadActivities } from "./loadActivities";
import { spaceFilesFromPosts } from "./listSpaceFiles";
import { loadSpaceMembers } from "./loadSpaceMembers";

/**
 * Monta a página de um espaço (stream, arquivos, membros e atividades).
 * Carrega espaço, publicações, membros, usuário e atividades em paralelo;
 * deriva arquivos e se o usuário pode gerir o espaço.
 */
export async function getSpacePage(
  token: string,
  spaceId: number,
  spaces: SpaceRepository,
  feed: FeedRepository,
  auth: AuthRepository,
) {
  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    throw new ApplicationError("Espaço inválido.", 404);
  }

  const [{ space, membership }, posts, members, user, activities] =
    await Promise.all([
      spaces.getDetails(token, spaceId),
      loadSpacePosts(feed, token, spaceId),
      loadSpaceMembers(spaces, token, spaceId),
      auth.getCurrentUser(token),
      loadActivities(feed, token, spaceId),
    ]);

  const canManage = canManageSpace(user, members);

  return {
    space,
    membership,
    posts,
    files: spaceFilesFromPosts(posts, { userId: user.id, canManage }),
    members,
    activities,
    canManage,
  };
}

/**
 * Busca as publicações do espaço sem derrubar a página se o feed falhar.
 * Propaga só 401; nos demais erros registra e devolve lista vazia.
 */
async function loadSpacePosts(
  feed: FeedRepository,
  token: string,
  spaceId: number,
): Promise<Post[]> {
  try {
    return await feed.listPosts(token, spaceId);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao carregar publicações do espaço ${spaceId}: ${errorMessage(error, "erro desconhecido")}`,
    );
    return [];
  }
}
