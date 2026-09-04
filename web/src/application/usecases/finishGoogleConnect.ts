import { getCurrentUser } from "./getCurrentUser";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type {
  GoogleAccountRepository,
  GoogleOAuthRepository,
} from "../ports/GoogleAccountRepository";

/**
 * Troca o code do Google pelos tokens e grava o vínculo do usuário.
 * Confere se o state aponta para o mesmo usuário autenticado.
 */
export async function finishGoogleConnect(
  auth: AuthRepository,
  oauth: GoogleOAuthRepository,
  accounts: GoogleAccountRepository,
  token: string,
  code: string,
  state: string,
) {
  const trimmedCode = code.trim();
  const trimmedState = state.trim();
  if (!trimmedCode || !trimmedState) {
    throw new ApplicationError("Retorno do Google incompleto.", 400);
  }

  const user = await getCurrentUser(auth, token);
  if (oauth.userIdFromState(trimmedState) !== user.id) {
    throw new ApplicationError("O vínculo Google não é desta sessão.", 403);
  }

  const exchanged = await oauth.exchangeCode(trimmedCode);
  return accounts.save(token, exchanged);
}
