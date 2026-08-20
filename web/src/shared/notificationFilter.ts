import type { NotificationListQuery } from "@/application/NotificationListQuery";
import {
  ALL_NOTIFICATION_CATEGORY_IDS,
  NOTIFICATION_CATEGORIES,
} from "@/domain/NotificationCategory";

export type NotificationFilterState = {
  includeUnseen: boolean;
  includeSeen: boolean;
  selectedCategoryIds: string[];
};

export function readNotificationFilter(
  searchParams: Record<string, string | string[] | undefined>,
): NotificationFilterState {
  return {
    includeUnseen: readFlag(searchParams.naoVisto, true),
    includeSeen: readFlag(searchParams.visto, true),
    selectedCategoryIds: readSelectedCategories(searchParams.cat),
  };
}

export function toNotificationListQuery(
  filter: NotificationFilterState,
): NotificationListQuery {
  return {
    includeUnseen: filter.includeUnseen,
    includeSeen: filter.includeSeen,
    excludedCategoryIds: ALL_NOTIFICATION_CATEGORY_IDS.filter(
      (id) => !filter.selectedCategoryIds.includes(id),
    ),
  };
}

export function buildNotificationFilterHref(
  filter: NotificationFilterState,
): string {
  const search = new URLSearchParams();

  if (!filter.includeUnseen) {
    search.set("naoVisto", "0");
  }

  if (!filter.includeSeen) {
    search.set("visto", "0");
  }

  if (filter.selectedCategoryIds.length !== NOTIFICATION_CATEGORIES.length) {
    search.set("cat", filter.selectedCategoryIds.join(","));
  }

  const query = search.toString();
  return query ? `/notificacoes?${query}` : "/notificacoes";
}

function readFlag(
  value: string | string[] | undefined,
  fallback: boolean,
): boolean {
  const raw = firstValue(value);
  if (raw === undefined) {
    return fallback;
  }

  return raw !== "0";
}

function readSelectedCategories(
  value: string | string[] | undefined,
): string[] {
  const raw = firstValue(value);
  if (raw === undefined) {
    return [...ALL_NOTIFICATION_CATEGORY_IDS];
  }

  return raw
    .split(",")
    .filter((id) => ALL_NOTIFICATION_CATEGORY_IDS.includes(id));
}

function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
