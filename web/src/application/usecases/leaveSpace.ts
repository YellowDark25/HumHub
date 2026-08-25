import { ApplicationError } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export function leaveSpace(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
) {
  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  return spaces.leave(token, spaceId);
}
