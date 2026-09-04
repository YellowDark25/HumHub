import type { GoogleAccountRepository } from "../ports/GoogleAccountRepository";

/**
 * Remove o vínculo Google do usuário autenticado.
 * Apaga o refresh token gravado; a agenda no Google permanece.
 */
export function disconnectGoogleAccount(
  accounts: GoogleAccountRepository,
  token: string,
) {
  return accounts.disconnect(token);
}
