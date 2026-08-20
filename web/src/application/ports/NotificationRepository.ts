import type { Notification } from "@/domain/Notification";

export type NotificationListOptions = {
  limit?: number;
  excludedCategoryIds?: string[];
};

export interface NotificationRepository {
  list(token: string, options?: NotificationListOptions): Promise<Notification[]>;
  countUnseen(token: string): Promise<number>;
  markAllAsSeen(token: string): Promise<void>;
}
