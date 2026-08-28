import type { SpaceMember } from "@/domain/SpaceMember";
import { errorMessage, isUnauthorized } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

/**
 * Lista os membros do espaço sem derrubar a página.
 * Propaga só 401; sem acesso ou outro erro, registra e devolve lista vazia.
 */
export async function loadSpaceMembers(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
): Promise<SpaceMember[]> {
  try {
    return await spaces.listMembers(token, spaceId);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao listar membros do espaço ${spaceId}: ${errorMessage(error, "erro desconhecido")}`,
    );
    return [];
  }
}
