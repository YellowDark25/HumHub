import type { NotificationLiveSubscription } from "@/domain/NotificationLive";
import type { NotificationRepository } from "../ports/NotificationRepository";

export function getNotificationLiveSubscription(
  notifications: NotificationRepository,
  token: string,
): Promise<NotificationLiveSubscription | null> {
  return notifications.getLiveSubscription(token);
}
