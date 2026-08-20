import type { NotificationRepository } from "../ports/NotificationRepository";

export function countUnseenNotifications(
  notifications: NotificationRepository,
  token: string,
) {
  return notifications.countUnseen(token);
}
