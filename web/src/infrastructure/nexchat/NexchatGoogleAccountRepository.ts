import { ApplicationError } from "@/application/errors";
import type { GoogleAccountRepository } from "@/application/ports/GoogleAccountRepository";
import type { GoogleAccountStatus } from "@/domain/GoogleAccount";
import { nexchatRequest } from "./client";

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
   */
  async getStatus(token: string): Promise<GoogleAccountStatus> {
    const result = await nexchatRequest<StatusResult>({
      path: "google-account",
      token,
    });
    return {
      connected: Boolean(result.connected),
      email: result.email?.trim() ?? "",
    };
  }

  /**
   * Grava o refresh token depois do OAuth.
   */
  async save(
    token: string,
    input: { refreshToken: string; email: string; expiresAt: string | null },
  ): Promise<GoogleAccountStatus> {
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
  }

  /**
   * Apaga o vínculo Google deste usuário.
   */
  async disconnect(token: string): Promise<void> {
    await nexchatRequest<StatusResult>({
      path: "google-account",
      token,
      method: "DELETE",
    });
  }
}
