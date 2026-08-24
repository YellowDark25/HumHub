export const CHAT_NOTIFICATION_LEVELS = ["all", "mentions", "nothing"] as const;

export type ChatNotificationLevel = (typeof CHAT_NOTIFICATION_LEVELS)[number];

export const CHAT_MUTE_DURATIONS = [
  "15m",
  "1h",
  "3h",
  "8h",
  "24h",
  "untilOn",
] as const;

export type ChatMuteDuration = (typeof CHAT_MUTE_DURATIONS)[number];

export type ChatNotificationPreference = {
  spaceId: number;
  level: ChatNotificationLevel;
  mutedUntil: string | null;
  isMuted: boolean;
};

export type ChatNotificationPreferencePatch = {
  spaceId: number;
  level?: ChatNotificationLevel;
  muteDuration?: ChatMuteDuration | null;
};
