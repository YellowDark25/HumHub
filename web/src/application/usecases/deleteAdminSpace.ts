import type { AuthRepository } from "../ports/AuthRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { requireAdminAccess } from "./requireAdminAccess";
import { requirePositiveId } from "./requirePositiveId";

/**
 * Exclui um espaço pela administração.
 * Confere se o ator é administrador, valida o id e pede a exclusão ao repositório.
 * @param token sessão autenticada do administrador.
 * @param spaceId identificador do espaço a remover.
 */
export async function deleteAdminSpace(
  auth: AuthRepository,
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
) {
  await requireAdminAccess(auth, token);
  const id = requirePositiveId(spaceId, "Espaço inválido.");
  await spaces.delete(token, id);
}
