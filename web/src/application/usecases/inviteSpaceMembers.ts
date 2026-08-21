import type { SpaceInviteInput } from "@/domain/SpaceInvite";
import { ApplicationError } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export function inviteSpaceMembers(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
  input: SpaceInviteInput,
) {
  if (!spaceId) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  if (!input.selectAllRegistered && input.userIds.length === 0) {
    throw new ApplicationError("Selecione pelo menos um usuário.", 400);
  }

  return spaces.inviteMembers(token, spaceId, {
    userIds: uniquePositiveIds(input.userIds),
    selectAllRegistered: input.selectAllRegistered,
    addWithoutInvite: input.addWithoutInvite,
    addAsDefaultSpace: input.addAsDefaultSpace,
  });
}

function uniquePositiveIds(userIds: number[]) {
  return [...new Set(userIds.filter((userId) => userId > 0))];
}
