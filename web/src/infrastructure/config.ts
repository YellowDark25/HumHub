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

export function getLiveKitUrl(): string {
  const url = process.env.LIVEKIT_URL?.trim();

  if (!url) {
    throw new Error("LIVEKIT_URL não está definida.");
  }

  return url.replace(/\/$/, "");
}

export function getPublicLiveKitUrl(): string {
  return (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "ws://localhost:7880").replace(
    /\/$/,
    "",
  );
}

export function getLiveKitApiKey(): string {
  const key = process.env.LIVEKIT_API_KEY?.trim();

  if (!key) {
    throw new Error("LIVEKIT_API_KEY não está definida.");
  }

  return key;
}

export function getLiveKitApiSecret(): string {
  const secret = process.env.LIVEKIT_API_SECRET?.trim();

  if (!secret) {
    throw new Error("LIVEKIT_API_SECRET não está definida.");
  }

  return secret;
}

export function getLiveKitHttpUrl(): string {
  return getLiveKitUrl().replace(/^ws:/, "http:").replace(/^wss:/, "https:");
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
