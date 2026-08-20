const MINUTE_IN_MS = 60_000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export function formatDate(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return value ?? "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeDate(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  const elapsedMs = Date.now() - date.getTime();
  if (elapsedMs < MINUTE_IN_MS) {
    return "agora";
  }

  if (elapsedMs < HOUR_IN_MS) {
    const minutes = Math.floor(elapsedMs / MINUTE_IN_MS);
    return `há ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  }

  if (elapsedMs < DAY_IN_MS) {
    const hours = Math.floor(elapsedMs / HOUR_IN_MS);
    return `há ${hours} hora${hours === 1 ? "" : "s"}`;
  }

  const days = Math.floor(elapsedMs / DAY_IN_MS);
  if (days < 7) {
    return `há ${days} dia${days === 1 ? "" : "s"}`;
  }

  return formatDate(value);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
