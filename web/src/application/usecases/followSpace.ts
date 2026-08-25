import { ApplicationError } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export function followSpace(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
) {
  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  return spaces.follow(token, spaceId);
}
