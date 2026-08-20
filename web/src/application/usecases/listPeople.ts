import type { User } from "@/domain/User";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { loadSpaceMembers } from "./loadSpaceMembers";

export async function listPeople(
  spaces: SpaceRepository,
  token: string,
): Promise<User[]> {
  const spaceList = await spaces.list(token);
  const membershipGroups = await Promise.all(
    spaceList.map((space) => loadSpaceMembers(spaces, token, space.id)),
  );

  const unique = new Map<number, User>();
  for (const members of membershipGroups) {
    for (const member of members) {
      unique.set(member.user.id, member.user);
    }
  }

  return [...unique.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR"),
  );
}
