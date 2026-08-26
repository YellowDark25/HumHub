import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { FeedRepository } from "../ports/FeedRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { canManageSpace } from "./canManageSpace";
import { loadSpaceMembers } from "./loadSpaceMembers";
import { requirePositiveId } from "./requirePositiveId";

/**
 * Exclui um arquivo do espaço apagando a publicação que o contém.
 * Valida ids, acha o anexo nas publicações do espaço, autoriza autor ou
 * gestor e pede ao feed para apagar a publicação (única forma no HumHub).
 * @param spaceId espaço dono do arquivo.
 * @param fileId id do anexo.
 */
export async function deleteSpaceFile(
  feed: FeedRepository,
  spaces: SpaceRepository,
  auth: AuthRepository,
  token: string,
  spaceId: number,
  fileId: number,
) {
  const validSpaceId = requirePositiveId(spaceId, "Espaço inválido.");
  const validFileId = requirePositiveId(fileId, "Arquivo inválido.");

  const [user, posts, members] = await Promise.all([
    auth.getCurrentUser(token),
    feed.listPosts(token, validSpaceId),
    loadSpaceMembers(spaces, token, validSpaceId),
  ]);

  const owner = posts.find((post) =>
    post.attachments.some((file) => file.id === validFileId),
  );
  if (!owner) {
    throw new ApplicationError("Arquivo não encontrado neste espaço.", 404);
  }

  if (!canManageSpace(user, members) && owner.authorId !== user.id) {
    throw new ApplicationError("Você não pode excluir este arquivo.", 403);
  }

  await feed.deletePost(token, owner.id);
}
