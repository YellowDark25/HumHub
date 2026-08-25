import type { SpaceRepository } from "../ports/SpaceRepository";

export function listVisibleSpaces(spaces: SpaceRepository, token: string) {
  return spaces.listVisible(token);
}
