import type { NotificationRepository } from "../ports/NotificationRepository";

export function markAllNotificationsAsSeen(
  notifications: NotificationRepository,
  token: string,
) {
  return notifications.markAllAsSeen(token);
}
