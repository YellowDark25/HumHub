export const CHANNEL_NAME_MAX = 100;
export const CHANNEL_TOPIC_MAX = 1024;

export const SLOW_MODE_OPTIONS = [
  { seconds: 0, label: "Desligado" },
  { seconds: 10, label: "10 segundos" },
  { seconds: 30, label: "30 segundos" },
  { seconds: 60, label: "1 minuto" },
  { seconds: 300, label: "5 minutos" },
  { seconds: 900, label: "15 minutos" },
  { seconds: 3600, label: "1 hora" },
  { seconds: 21600, label: "6 horas" },
] as const;

export function normalizeChannelName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-_]/gu, "")
    .slice(0, CHANNEL_NAME_MAX);
}
