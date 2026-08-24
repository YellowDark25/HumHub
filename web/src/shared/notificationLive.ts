import type { Notification } from "@/domain/Notification";
import type {
  NotificationLiveEvent,
  NotificationLiveSubscription,
} from "@/domain/NotificationLive";
import { notificationHref } from "./notificationHref";

export const NOTIFICATION_LIVE_POLL_MS = 10_000;

export function notificationLiveHubUrl(
  subscription: NotificationLiveSubscription,
): string {
  const url = new URL(subscription.hubUrl);
  url.searchParams.set("authorization", subscription.token);
  url.searchParams.set("topic", subscription.topic);
  return url.toString();
}

export function readNotificationLiveSubscription(
  payload: unknown,
): NotificationLiveSubscription | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (
    typeof payload.hubUrl !== "string" ||
    typeof payload.topic !== "string" ||
    typeof payload.token !== "string"
  ) {
    return null;
  }

  const hubUrl = payload.hubUrl.trim();
  const topic = payload.topic.trim();
  const token = payload.token.trim();
  if (!hubUrl || !topic || !token) {
    return null;
  }

  return { hubUrl, topic, token };
}

export function readUnseenCountPayload(payload: unknown): number | null {
  if (!isRecord(payload) || typeof payload.unseenCount !== "number") {
    return null;
  }

  if (!Number.isFinite(payload.unseenCount) || payload.unseenCount < 0) {
    return null;
  }

  return Math.trunc(payload.unseenCount);
}

export function readNotificationLiveEvent(
  payload: unknown,
): NotificationLiveEvent | null {
  if (!isRecord(payload)) {
    return null;
  }

  const unseenCount = readUnseenCountPayload(payload);
  if (unseenCount === null) {
    return null;
  }

  return {
    unseenCount,
    notification: readLiveNotification(payload.notification),
  };
}

export function mergeLiveNotification(
  current: Notification[],
  incoming: Notification,
  limit: number,
): Notification[] {
  return [incoming, ...current.filter((item) => item.id !== incoming.id)].slice(
    0,
    limit,
  );
}

function readLiveNotification(payload: unknown): Notification | null {
  if (!isRecord(payload) || typeof payload.id !== "number" || !payload.id) {
    return null;
  }

  const text =
    typeof payload.text === "string" && payload.text.trim()
      ? payload.text.trim()
      : "Nova notificação";

  return {
    id: payload.id,
    text,
    originatorName:
      typeof payload.originatorName === "string" ? payload.originatorName : null,
    originatorImageUrl:
      typeof payload.originatorImageUrl === "string"
        ? payload.originatorImageUrl
        : "",
    publishedAt:
      typeof payload.publishedAt === "string" ? payload.publishedAt : null,
    isUnseen: payload.isUnseen !== false,
    href: notificationHref(text),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
