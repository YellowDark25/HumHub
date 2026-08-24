import type { SpaceMember } from "@/domain/SpaceMember";
import { errorMessage, isForbidden, isUnauthorized } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export async function loadSpaceMembers(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
): Promise<SpaceMember[]> {
  try {
    return await spaces.listMembers(token, spaceId);
  } catch (error) {
    if (isSpaceAdminOnlyError(error)) {
      return [];
    }

    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao listar membros do espaço ${spaceId}: ${errorMessage(error, "erro desconhecido")}`,
    );
    return [];
  }
}

function isSpaceAdminOnlyError(error: unknown): boolean {
  return (
    isForbidden(error) ||
    /cannot administer this space/i.test(errorMessage(error, ""))
  );
}
