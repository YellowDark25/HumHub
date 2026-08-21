import { ApplicationError } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export function listSpaceInvitees(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
) {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  return spaces.listInvitableUsers(token, spaceId);
}
