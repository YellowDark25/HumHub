import { getCurrentUser } from "./getCurrentUser";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { GoogleOAuthRepository } from "../ports/GoogleAccountRepository";

/**
 * Monta a URL do OAuth Google para o usuário autenticado.
 * Lê o usuário pelo token e assina o state com o id dele.
 */
export async function startGoogleConnect(
  auth: AuthRepository,
  oauth: GoogleOAuthRepository,
  token: string,
) {
  if (!oauth.isConfigured()) {
    throw new ApplicationError(
      "O Google ainda não está configurado neste ambiente.",
      503,
    );
  }

  const user = await getCurrentUser(auth, token);
  return { url: oauth.authorizationUrl(user.id) };
}
