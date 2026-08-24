import { ApplicationError } from "../errors";
import type { NotificationRepository } from "../ports/NotificationRepository";

export function openNotificationLiveStream(
  notifications: NotificationRepository,
  token: string,
) {
  if (!token) {
    throw new ApplicationError("Não autenticado.", 401);
  }

  return notifications.openLiveStream(token);
}
