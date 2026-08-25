const CALL_PREFIX = "nexhub-call:v1:";
const MINUTE_IN_SECONDS = 60;
const HOUR_IN_MINUTES = 60;
const SHORT_CALL_SECONDS = 60;

export type ChatCallEvent = {
  status: "started" | "ended";
  durationSeconds: number;
};

export function writeChatCallEvent(event: ChatCallEvent): string {
  if (event.status === "started") {
    return `${CALL_PREFIX}started`;
  }

  return `${CALL_PREFIX}ended:${Math.max(0, Math.floor(event.durationSeconds))}`;
}

export function readChatCallEvent(content: string): ChatCallEvent | null {
  const trimmed = content.trim();
  if (trimmed === `${CALL_PREFIX}started`) {
    return { status: "started", durationSeconds: 0 };
  }

  const ended = trimmed.match(/^nexhub-call:v1:ended:(\d+)$/);
  if (!ended) {
    return null;
  }

  return { status: "ended", durationSeconds: Number(ended[1]) };
}

export function chatCallPreview(content: string): string {
  const event = readChatCallEvent(content);
  if (!event) {
    return "";
  }

  return event.status === "started" ? "Iniciou uma chamada" : "Chamada encerrada";
}

export function chatCallActionLabel(event: ChatCallEvent): string {
  if (event.status === "started") {
    return "iniciou uma chamada.";
  }

  return `iniciou uma chamada que durou ${chatCallDurationPhrase(event.durationSeconds)}.`;
}

export function chatCallDurationPhrase(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  if (safe < SHORT_CALL_SECONDS) {
    return "poucos segundos";
  }

  const minutes = Math.round(safe / MINUTE_IN_SECONDS);
  if (minutes < HOUR_IN_MINUTES) {
    return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
  }

  const hours = Math.floor(minutes / HOUR_IN_MINUTES);
  const rest = minutes % HOUR_IN_MINUTES;
  const hourLabel = hours === 1 ? "1 hora" : `${hours} horas`;
  if (rest === 0) {
    return hourLabel;
  }

  const minuteLabel = rest === 1 ? "1 minuto" : `${rest} minutos`;
  return `${hourLabel} e ${minuteLabel}`;
}
