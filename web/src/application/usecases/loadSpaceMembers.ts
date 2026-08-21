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
    if (isUnauthorized(error)) {
      throw error;
    }

    // A API REST de membership só aceita quem administra o espaço.
    if (isForbidden(error)) {
      return [];
    }

    console.error(
      `Falha ao listar membros do espaço ${spaceId}: ${errorMessage(error, "erro desconhecido")}`,
    );
    return [];
  }
}
