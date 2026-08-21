import { ApplicationError } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export function declineSpaceInvite(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
) {
  if (!spaceId) {
    throw new ApplicationError("Convite inválido.", 400);
  }

  return spaces.declineInvite(token, spaceId);
}
