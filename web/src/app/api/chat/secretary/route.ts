import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Abre a DM com a secretária do usuário autenticado.
 * Não aceita userId no corpo — o id vem da configuração Kaizzen.
 */
export async function POST() {
  try {
    const token = await requireAuthToken();
    const conversation = await app.openSecretaryDm(token);
    return NextResponse.json(conversation);
  } catch (error) {
    return jsonError(error, "Não foi possível abrir a secretária.");
  }
}
