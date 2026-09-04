import type { GoogleAccountStatus } from "@/domain/GoogleAccount";

/**
 * Porta do vínculo Google do usuário autenticado.
 * Lê status, grava tokens depois do OAuth e desconecta.
 */
export interface GoogleAccountRepository {
  getStatus(token: string): Promise<GoogleAccountStatus>;
  save(
    token: string,
    input: { refreshToken: string; email: string; expiresAt: string | null },
  ): Promise<GoogleAccountStatus>;
  disconnect(token: string): Promise<void>;
}

/**
 * Porta do fluxo OAuth do Google (URL e troca do code).
 */
export interface GoogleOAuthRepository {
  isConfigured(): boolean;
  authorizationUrl(userId: number): string;
  userIdFromState(state: string): number;
  exchangeCode(code: string): Promise<{
    refreshToken: string;
    email: string;
    expiresAt: string | null;
  }>;
}
