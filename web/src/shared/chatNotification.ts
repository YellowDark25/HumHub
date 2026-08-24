import type { ChatWorkspace } from "@/domain/ChatWorkspace";
import {
  CHAT_MUTE_DURATIONS,
  CHAT_NOTIFICATION_LEVELS,
  type ChatMuteDuration,
  type ChatNotificationLevel,
  type ChatNotificationPreference,
} from "@/domain/ChatNotificationPreference";

export function defaultChatNotificationPreference(
  spaceId: number,
): ChatNotificationPreference {
  return {
    spaceId,
    level: "mentions",
    mutedUntil: null,
    isMuted: false,
  };
}

export function chatNotificationSpaceId(workspace: ChatWorkspace): number | null {
  if (workspace.kind === "home") {
    return null;
  }

  return workspace.spaceId ?? 0;
}

export const CHAT_NOTIFICATION_LEVEL_OPTIONS: {
  id: ChatNotificationLevel;
  label: string;
}[] = [
  { id: "all", label: "Todas as mensagens" },
  { id: "mentions", label: "Apenas @menções" },
  { id: "nothing", label: "Nada" },
];

export const CHAT_MUTE_DURATION_OPTIONS: {
  id: ChatMuteDuration;
  label: string;
}[] = [
  { id: "15m", label: "Por 15 minutos" },
  { id: "1h", label: "Por 1 hora" },
  { id: "3h", label: "Por 3 horas" },
  { id: "8h", label: "Por 8 horas" },
  { id: "24h", label: "Por 24 horas" },
  { id: "untilOn", label: "Até eu ligá-las de novo" },
];

export function isChatNotificationLevel(
  value: unknown,
): value is ChatNotificationLevel {
  return (
    typeof value === "string" &&
    CHAT_NOTIFICATION_LEVELS.includes(value as ChatNotificationLevel)
  );
}

export function isChatMuteDuration(value: unknown): value is ChatMuteDuration {
  return (
    typeof value === "string" &&
    CHAT_MUTE_DURATIONS.includes(value as ChatMuteDuration)
  );
}

export function chatNotificationLevelLabel(level: ChatNotificationLevel) {
  return (
    CHAT_NOTIFICATION_LEVEL_OPTIONS.find((option) => option.id === level)
      ?.label ?? "Apenas @menções"
  );
}
