import { ApplicationError, isNotFound } from "@/application/errors";
import type { GoogleAccountRepository } from "@/application/ports/GoogleAccountRepository";
import type { GoogleAccountStatus } from "@/domain/GoogleAccount";
import { nexchatRequest } from "./client";

const GOOGLE_ROUTE_MISSING =
  "O backend ainda não tem a rota do Google. Faça o redeploy do HumHub no Railway.";

/**
 * Troca 404 do HumHub por um erro que explica o redeploy.
 * Outros erros seguem iguais.
 */
function googleRouteMissing(error: unknown, fallback: string): unknown {
  if (isNotFound(error)) {
    return new ApplicationError(GOOGLE_ROUTE_MISSING, 503);
  }

  if (error instanceof ApplicationError) {
    return error;
  }

  return new ApplicationError(fallback, 500);
}

type StatusResult = {
  success?: boolean;
  connected?: boolean;
  email?: string;
  error?: string;
};

/**
 * Vínculo Google do usuário autenticado, via nexchat.
 * GET lê o status; POST grava tokens; DELETE remove.
 */
export class NexchatGoogleAccountRepository implements GoogleAccountRepository {
  /**
   * Diz se a conta Google já está ligada e qual e-mail.
   * GET em google-account; 404 (HumHub sem a action) vira desconectado.
   */
  async getStatus(token: string): Promise<GoogleAccountStatus> {
    try {
      const result = await nexchatRequest<StatusResult>({
        path: "google-account",
        token,
      });
      return {
        connected: Boolean(result.connected),
        email: result.email?.trim() ?? "",
      };
    } catch (error) {
      if (isNotFound(error)) {
        return { connected: false, email: "" };
      }
      throw error;
    }
  }

  /**
   * Grava o refresh token depois do OAuth.
   * POST em google-account; 404 vira erro explícito de backend desatualizado.
   */
  async save(
    token: string,
    input: { refreshToken: string; email: string; expiresAt: string | null },
  ): Promise<GoogleAccountStatus> {
    try {
      const result = await nexchatRequest<StatusResult>({
        path: "google-account",
        token,
        method: "POST",
        body: input,
      });
      if (result.success === false) {
        throw new ApplicationError(
          result.error || "Não foi possível salvar o vínculo Google.",
          400,
        );
      }

      return {
        connected: Boolean(result.connected),
        email: result.email?.trim() ?? input.email,
      };
    } catch (error) {
      throw googleRouteMissing(error, "Não foi possível salvar o vínculo Google.");
    }
  }

  /**
   * Apaga o vínculo Google deste usuário.
   * DELETE em google-account; 404 vira o mesmo erro de backend desatualizado.
   */
  async disconnect(token: string): Promise<void> {
    try {
      await nexchatRequest<StatusResult>({
        path: "google-account",
        token,
        method: "DELETE",
      });
    } catch (error) {
      throw googleRouteMissing(error, "Não foi possível desconectar o Google.");
    }
  }
}
