import { ApplicationError } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export function acceptSpaceInvite(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
) {
  if (!spaceId) {
    throw new ApplicationError("Convite inválido.", 400);
  }

  return spaces.acceptInvite(token, spaceId);
}
