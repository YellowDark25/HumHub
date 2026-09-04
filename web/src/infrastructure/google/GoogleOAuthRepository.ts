import { ApplicationError } from "@/application/errors";
import type { GoogleOAuthRepository as GoogleOAuthPort } from "@/application/ports/GoogleAccountRepository";
import {
  getGoogleClientId,
  getGoogleClientSecret,
  getKaizzenServiceSecret,
  getPublicAppUrl,
  isGoogleOAuthConfigured,
} from "../config";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

/**
 * OAuth Google: monta a URL, lê o state e troca o code por refresh token.
 * O state é userId assinado com o segredo do serviço para não trocar de conta.
 */
export class GoogleOAuthRepository implements GoogleOAuthPort {
  /**
   * Diz se client id e secret estão no ambiente.
   */
  isConfigured(): boolean {
    return isGoogleOAuthConfigured();
  }

  /**
   * URL de consentimento do Google com offline access.
   */
  authorizationUrl(userId: number): string {
    const params = new URLSearchParams({
      client_id: getGoogleClientId(),
      redirect_uri: redirectUri(),
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state: signState(userId),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Recupera o userId do state; falha se a assinatura não bater.
   */
  userIdFromState(state: string): number {
    const [payload, signature] = state.split(".");
    if (!payload || !signature || signature !== sign(payload)) {
      throw new ApplicationError("Estado do Google inválido.", 400);
    }

    const userId = Number.parseInt(payload, 10);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ApplicationError("Estado do Google inválido.", 400);
    }

    return userId;
  }

  /**
   * Troca o code por tokens e lê o e-mail da conta.
   */
  async exchangeCode(code: string): Promise<{
    refreshToken: string;
    email: string;
    expiresAt: string | null;
  }> {
    const body = new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await response.json()) as {
      refresh_token?: string;
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!response.ok || !data.access_token) {
      throw new ApplicationError(
        data.error || "Não foi possível concluir o login no Google.",
        400,
      );
    }

    if (!data.refresh_token) {
      throw new ApplicationError(
        "O Google não devolveu o refresh token. Revogue o acesso e conecte de novo.",
        400,
      );
    }

    return {
      refreshToken: data.refresh_token,
      email: await readEmail(data.access_token),
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
    };
  }
}

function redirectUri(): string {
  return `${getPublicAppUrl()}/api/account/google/callback`;
}

function signState(userId: number): string {
  const payload = String(userId);
  return `${payload}.${sign(payload)}`;
}

function sign(payload: string): string {
  const secret = getKaizzenServiceSecret() || getGoogleClientSecret();
  return Buffer.from(`${payload}:${secret}`).toString("base64url");
}

async function readEmail(accessToken: string): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = (await response.json()) as { email?: string };
  return data.email?.trim() || "google";
}
