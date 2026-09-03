import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Devolve o último id e o total de mensagens de cada conversa.
 * O cliente compara com o visto local para atualizar os badges.
 */
export async function GET() {
  try {
    const token = await requireAuthToken();
    const updates = await app.listConversationUpdates(token);
    return NextResponse.json(updates);
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar as conversas.");
  }
}
