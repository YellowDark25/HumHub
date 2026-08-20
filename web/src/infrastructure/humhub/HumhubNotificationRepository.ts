import type {
  NotificationListOptions,
  NotificationRepository,
} from "@/application/ports/NotificationRepository";
import type { Notification } from "@/domain/Notification";
import type {
  NotificationPreferencePatch,
  NotificationPreferences,
} from "@/domain/NotificationPreferences";
import { humhubRequest } from "./client";
import {
  HUMHUB_MAX_PAGE_LIMIT,
  NOTIFICATION_PAGE_LIMIT,
  UNSEEN_NOTIFICATION_LIMIT,
} from "./constants";
import { mapNotification, mapNotificationPreferences } from "./mappers";
import type {
  HumhubNotification,
  HumhubNotificationPreferences,
  HumhubPage,
} from "./types";

export class HumhubNotificationRepository implements NotificationRepository {
  async list(
    token: string,
    options: NotificationListOptions = {},
  ): Promise<Notification[]> {
    const pageLimit = resolvePageLimit(options.limit, NOTIFICATION_PAGE_LIMIT);
    const listPath = buildNotificationPath(
      "/notification",
      pageLimit,
      options.excludedCategoryIds,
    );
    const [page, unseenIds] = await Promise.all([
      fetchNotificationPage(token, listPath),
      loadUnseenIds(token, pageLimit),
    ]);

    return (page.results ?? []).map((dto) =>
      mapNotification(dto, unseenIds.has(dto.id)),
    );
  }

  async countUnseen(token: string): Promise<number> {
    const page = await fetchNotificationPage(
      token,
      `/notification/unseen?limit=${UNSEEN_NOTIFICATION_LIMIT}`,
    );

    return page.total ?? page.results?.length ?? 0;
  }

  async markAllAsSeen(token: string): Promise<void> {
    await humhubRequest({
      path: "/notification/mark-as-seen",
      method: "PATCH",
      token,
    });
  }

  async getPreferences(token: string): Promise<NotificationPreferences> {
    const dto = await humhubRequest<HumhubNotificationPreferences>({
      path: "/nexchat/notification-settings",
      token,
      origin: "app",
    });

    return mapNotificationPreferences(dto);
  }

  async savePreferences(
    token: string,
    patch: NotificationPreferencePatch,
  ): Promise<NotificationPreferences> {
    const dto = await humhubRequest<HumhubNotificationPreferences>({
      path: "/nexchat/notification-settings/save",
      method: "POST",
      token,
      origin: "app",
      body: patch,
    });

    return mapNotificationPreferences(dto);
  }

  async resetPreferences(token: string): Promise<NotificationPreferences> {
    const dto = await humhubRequest<HumhubNotificationPreferences>({
      path: "/nexchat/notification-settings/reset",
      method: "POST",
      token,
      origin: "app",
    });

    return mapNotificationPreferences(dto);
  }
}

async function fetchNotificationPage(token: string, path: string) {
  return humhubRequest<HumhubPage<HumhubNotification>>({ path, token });
}

async function loadUnseenIds(
  token: string,
  limit: number,
): Promise<Set<number>> {
  const page = await fetchNotificationPage(
    token,
    `/notification/unseen?limit=${limit}`,
  );

  return new Set((page.results ?? []).map((notification) => notification.id));
}

function buildNotificationPath(
  basePath: string,
  limit: number,
  excludedCategoryIds: string[] = [],
): string {
  const params = new URLSearchParams({ limit: String(limit) });
  for (const categoryId of excludedCategoryIds) {
    params.append("excludeFilters[]", categoryId);
  }

  return `${basePath}?${params.toString()}`;
}

function resolvePageLimit(limit: number | undefined, fallback: number): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), HUMHUB_MAX_PAGE_LIMIT);
}
