import type { Notification } from "@/domain/Notification";
import type { NotificationListQuery } from "../NotificationListQuery";
import type { NotificationRepository } from "../ports/NotificationRepository";

export async function listNotifications(
  notifications: NotificationRepository,
  token: string,
  query: NotificationListQuery = {},
) {
  const includeUnseen = query.includeUnseen ?? true;
  const includeSeen = query.includeSeen ?? true;

  if (!includeUnseen && !includeSeen) {
    return [];
  }

  const items = await notifications.list(token, {
    limit: query.limit,
    excludedCategoryIds: query.excludedCategoryIds,
  });

  return filterBySeen(items, includeUnseen, includeSeen);
}

function filterBySeen(
  items: Notification[],
  includeUnseen: boolean,
  includeSeen: boolean,
): Notification[] {
  if (includeUnseen && includeSeen) {
    return items;
  }

  return items.filter((item) =>
    includeUnseen ? item.isUnseen : !item.isUnseen,
  );
}
