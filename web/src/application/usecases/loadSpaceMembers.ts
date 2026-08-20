import type { SpaceMember } from "@/domain/SpaceMember";
import { isUnauthorized } from "../errors";
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

    console.error(`Falha ao listar membros do espaço ${spaceId}`, error);
    return [];
  }
}
