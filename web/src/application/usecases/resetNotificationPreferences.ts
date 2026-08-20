import type { NotificationRepository } from "../ports/NotificationRepository";

export function resetNotificationPreferences(
  notifications: NotificationRepository,
  token: string,
) {
  return notifications.resetPreferences(token);
}
