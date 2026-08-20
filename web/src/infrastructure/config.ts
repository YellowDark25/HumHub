export const AUTH_COOKIE_NAME = "hh_token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const MIN_TOKEN_TTL_SECONDS = 60;
const UNIX_SECONDS_THRESHOLD = 1_000_000_000;

export function getHumhubUrl(): string {
  const url = process.env.HUMHUB_URL?.trim();

  if (!url) {
    throw new Error("HUMHUB_URL não está definida.");
  }

  return url.replace(/\/$/, "");
}

export function getPublicHumhubUrl(): string {
  return (process.env.NEXT_PUBLIC_HUMHUB_URL ?? "http://localhost:8090").replace(
    /\/$/,
    "",
  );
}

export function resolveTokenMaxAge(
  expiredAt: string | number | undefined,
): number {
  if (typeof expiredAt === "number" && expiredAt > UNIX_SECONDS_THRESHOLD) {
    const seconds = expiredAt - Math.floor(Date.now() / 1000);
    return seconds > MIN_TOKEN_TTL_SECONDS
      ? seconds
      : AUTH_COOKIE_MAX_AGE_SECONDS;
  }

  if (typeof expiredAt === "string") {
    const parsed = Date.parse(expiredAt);
    if (!Number.isNaN(parsed)) {
      const seconds = Math.floor((parsed - Date.now()) / 1000);
      return seconds > MIN_TOKEN_TTL_SECONDS
        ? seconds
        : AUTH_COOKIE_MAX_AGE_SECONDS;
    }
  }

  return AUTH_COOKIE_MAX_AGE_SECONDS;
}
