import { ApplicationError } from "@/application/errors";
import { getKaizzenServiceSecret } from "../config";

export const KAIZZEN_SECRET_HEADER = "x-kaizzen-secret";

/**
 * Exige o header X-Kaizzen-Secret nas rotas do cano da secretária.
 * Compara com KAIZZEN_SERVICE_SECRET; sem match devolve 401.
 */
export function requireServiceSecret(request: Request) {
  const given = request.headers.get(KAIZZEN_SECRET_HEADER)?.trim() ?? "";
  const expected = getKaizzenServiceSecret();
  if (!given || !expected || given !== expected) {
    throw new ApplicationError("Serviço da secretária não autorizado.", 401);
  }
}
