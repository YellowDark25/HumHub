import type { SpaceRepository } from "../ports/SpaceRepository";

export function listReceivedSpaceInvites(
  spaces: SpaceRepository,
  token: string,
) {
  return spaces.listReceivedInvites(token);
}
