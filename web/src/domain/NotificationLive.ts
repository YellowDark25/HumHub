import type { Notification } from "./Notification";

export type NotificationLiveSubscription = {
  hubUrl: string;
  topic: string;
  token: string;
};

export type NotificationLiveEvent = {
  unseenCount: number;
  notification: Notification | null;
};

export type NotificationLiveStream = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
};
