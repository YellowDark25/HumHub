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

/**
 * Diz se o LiveKit está configurado para emitir token e falar com o Room Service.
 * Lê LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET; só é verdadeiro quando as três existem.
 * @returns true quando dá para criar sessão e listar salas.
 */
export function isLiveKitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_URL?.trim() &&
      process.env.LIVEKIT_API_KEY?.trim() &&
      process.env.LIVEKIT_API_SECRET?.trim(),
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

/**
 * Id do usuário HumHub da secretária.
 * Lê KAIZZEN_SECRETARY_USER_ID; sem valor devolve 0.
 */
export function getSecretaryUserId(): number {
  const raw = Number.parseInt(
    process.env.KAIZZEN_SECRETARY_USER_ID?.trim() ?? "7",
    10,
  );
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

/**
 * Segredo compartilhado com o HumHub no cano da secretária.
 * Vazio quando o env ainda não foi preenchido.
 */
export function getKaizzenServiceSecret(): string {
  const secret = process.env.KAIZZEN_SERVICE_SECRET?.trim();
  if (secret) {
    return secret;
  }

  return process.env.NODE_ENV === "production"
    ? ""
    : "kaizzen-local-service-secret";
}

/**
 * URL pública deste app Next (OAuth e links da secretária).
 */
export function getPublicAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3001"
  ).replace(/\/$/, "");
}

/**
 * Client id OAuth do Google.
 */
export function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
}

/**
 * Client secret OAuth do Google.
 */
export function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
}

/**
 * Diz se o OAuth Google está completo o bastante para conectar a conta.
 */
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
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
