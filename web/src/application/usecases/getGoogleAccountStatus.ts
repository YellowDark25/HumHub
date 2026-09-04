import type { GoogleAccountRepository } from "../ports/GoogleAccountRepository";

/**
 * Lê se o usuário já conectou o Google Calendar/Tasks.
 * Devolve e-mail quando há vínculo; senão connected=false.
 */
export function getGoogleAccountStatus(
  accounts: GoogleAccountRepository,
  token: string,
) {
  return accounts.getStatus(token);
}
