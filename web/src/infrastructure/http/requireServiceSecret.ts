import { ApplicationError } from "@/application/errors";
import { getKaizzenServiceSecret } from "../config";

export const KAIZZEN_SECRET_HEADER = "x-kaizzen-secret";

/**
 * Exige o header X-Kaizzen-Secret nas rotas do cano da secretária.
 * Compara com KAIZZEN_SERVICE_SECRET; sem match devolve 401.
 */
export function requireServiceSecret(request: Request) {
  const given = readServiceSecret(request);
  const expected = getKaizzenServiceSecret();
  if (!given || !expected || given !== expected) {
    throw new ApplicationError("Serviço da secretária não autorizado.", 401);
  }
}

/**
 * Lê o segredo do header próprio ou do Authorization Bearer.
 */
function readServiceSecret(request: Request): string {
  const header = request.headers.get(KAIZZEN_SECRET_HEADER)?.trim() ?? "";
  if (header) {
    return header;
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}
