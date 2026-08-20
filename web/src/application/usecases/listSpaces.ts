import type { SpaceRepository } from "../ports/SpaceRepository";

export function listSpaces(spaces: SpaceRepository, token: string) {
  return spaces.list(token);
}
