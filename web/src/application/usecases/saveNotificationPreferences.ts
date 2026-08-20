import { ApplicationError } from "../errors";
import type { NotificationPreferencePatch } from "@/domain/NotificationPreferences";
import type { NotificationRepository } from "../ports/NotificationRepository";

const MAX_NOTIFICATION_SPACES = 10;

export function saveNotificationPreferences(
  notifications: NotificationRepository,
  token: string,
  patch: NotificationPreferencePatch,
) {
  const spaceIds = uniquePositiveIds(patch.spaceIds);
  if (spaceIds.length > MAX_NOTIFICATION_SPACES) {
    throw new ApplicationError(
      "Selecione no máximo 10 espaços para conteúdo novo.",
      400,
    );
  }

  return notifications.savePreferences(token, {
    spaceIds,
    channels: patch.channels ?? {},
  });
}

function uniquePositiveIds(ids: number[]): number[] {
  const unique = new Set<number>();
  for (const id of ids ?? []) {
    if (Number.isFinite(id) && id > 0) {
      unique.add(Math.trunc(id));
    }
  }

  return [...unique];
}
