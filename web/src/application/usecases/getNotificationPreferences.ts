import type { NotificationRepository } from "../ports/NotificationRepository";

export function getNotificationPreferences(
  notifications: NotificationRepository,
  token: string,
) {
  return notifications.getPreferences(token);
}
