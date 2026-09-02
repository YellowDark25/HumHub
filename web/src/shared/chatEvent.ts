import type { ChatEventFrequency, ChatEventLocationKind } from "@/domain/ChatEvent";
import { parseDate } from "./format";

export const EVENT_TITLE_MAX = 100;
export const EVENT_DESCRIPTION_MAX = 2000;
export const EVENT_LOCATION_MAX = 255;
export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const EVENT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const EVENT_START_WINDOW_MS = 5 * 60 * 1000;

export const EVENT_FREQUENCIES: { value: ChatEventFrequency; label: string }[] =
  [
    { value: "none", label: "Não se repete" },
    { value: "weekly", label: "Toda semana" },
    { value: "monthly", label: "Todo mês" },
  ];

/**
 * Diz se o texto é um tipo de local válido do evento.
 * Aceita canal de voz ou localização livre.
 */
export function isChatEventLocationKind(
  value: string,
): value is ChatEventLocationKind {
  return value === "voice" || value === "elsewhere";
}

/**
 * Diz se a frequência do evento é uma das opções conhecidas.
 */
export function isChatEventFrequency(value: string): value is ChatEventFrequency {
  return value === "none" || value === "weekly" || value === "monthly";
}

/**
 * Monta horários de 30 em 30 minutos para o seletor do assistente.
 * @returns lista no formato HH:mm.
 */
export function eventTimeOptions(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 30]) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
    }
  }

  return slots;
}

/**
 * Combina data (YYYY-MM-DD) e hora (HH:mm) num ISO local.
 * Sem data ou hora válida devolve string vazia.
 */
export function combineEventDateTime(date: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return "";
  }

  return `${date}T${time}:00`;
}

/**
 * Rótulo da listagem com a quantidade de eventos.
 * Zero vira "Eventos"; um vira "1 Evento"; demais usam o plural.
 */
export function eventCountLabel(count: number): string {
  if (count <= 0) {
    return "Eventos";
  }

  return count === 1 ? "1 Evento" : `${count} Eventos`;
}

/**
 * Contagem regressiva até o início, no estilo "Começa em 41m".
 * Sem data válida devolve string vazia; se já passou, "Já começou".
 */
export function formatEventCountdown(
  value: string | null | undefined,
  nowMs = Date.now(),
): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  const remainingMs = date.getTime() - nowMs;
  if (remainingMs <= 0) {
    return "Já começou";
  }

  const remainingMinutes = Math.round(remainingMs / 60_000);
  if (remainingMinutes < 60) {
    return `Começa em ${Math.max(1, remainingMinutes)}m`;
  }

  const remainingHours = Math.round(remainingMinutes / 60);
  if (remainingHours < 24) {
    return `Começa em ${remainingHours}h`;
  }

  return formatEventWhen(value);
}

/**
 * Diz se o evento já pode ser começado e tem canal de destino.
 * Vale nos 5 minutos antes do horário e depois que o horário passou.
 */
export function canStartChatEvent(
  startsAt: string,
  conversationId: number | null,
  nowMs = Date.now(),
): boolean {
  if (!conversationId) {
    return false;
  }

  const date = parseDate(startsAt);
  if (!date) {
    return false;
  }

  return date.getTime() - nowMs <= EVENT_START_WINDOW_MS;
}

/**
 * Formata o início do evento no estilo "Hoje às 13:00".
 * Sem data válida devolve string vazia.
 */
export function formatEventWhen(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  const clock = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const dayLabel = eventDayLabel(date);

  return `${dayLabel} às ${clock}`;
}

/**
 * Rótulo curto da frequência para o cartão do evento.
 */
export function eventFrequencyLabel(frequency: ChatEventFrequency): string {
  return (
    EVENT_FREQUENCIES.find((option) => option.value === frequency)?.label ??
    "Não se repete"
  );
}

function eventDayLabel(date: Date): string {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) {
    return "Hoje";
  }

  if (diffDays === 1) {
    return "Amanhã";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
