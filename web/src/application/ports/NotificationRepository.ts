import type { Notification } from "@/domain/Notification";
import type {
  NotificationPreferencePatch,
  NotificationPreferences,
} from "@/domain/NotificationPreferences";

export type NotificationListOptions = {
  limit?: number;
  excludedCategoryIds?: string[];
};

export interface NotificationRepository {
  list(token: string, options?: NotificationListOptions): Promise<Notification[]>;
  countUnseen(token: string): Promise<number>;
  markAllAsSeen(token: string): Promise<void>;
  getPreferences(token: string): Promise<NotificationPreferences>;
  savePreferences(
    token: string,
    patch: NotificationPreferencePatch,
  ): Promise<NotificationPreferences>;
  resetPreferences(token: string): Promise<NotificationPreferences>;
}
