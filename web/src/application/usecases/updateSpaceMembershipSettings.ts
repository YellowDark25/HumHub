import type { SpaceMembershipSettingsPatch } from "@/domain/SpaceMembershipSettings";
import { ApplicationError } from "../errors";
import type { SpaceRepository } from "../ports/SpaceRepository";

export function updateSpaceMembershipSettings(
  spaces: SpaceRepository,
  token: string,
  spaceId: number,
  patch: SpaceMembershipSettingsPatch,
) {
  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  if (
    typeof patch.receivesNotifications !== "boolean" &&
    typeof patch.showsOnDashboard !== "boolean"
  ) {
    throw new ApplicationError("Nenhuma configuração para atualizar.", 400);
  }

  return spaces.updateMembershipSettings(token, spaceId, {
    receivesNotifications:
      typeof patch.receivesNotifications === "boolean"
        ? patch.receivesNotifications
        : undefined,
    showsOnDashboard:
      typeof patch.showsOnDashboard === "boolean"
        ? patch.showsOnDashboard
        : undefined,
  });
}
