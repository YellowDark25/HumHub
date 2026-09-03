import { HOME_WORKSPACE_ID } from "@/domain/ChatWorkspace";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { NextResponse } from "next/server";

/**
 * Devolve o painel de uma conversa para a troca de aba no cliente.
 * Lê id e servidor da query; exige sessão.
 */
export async function GET(request: Request) {
  try {
    const token = await requireAuthToken();
    const params = new URL(request.url).searchParams;
    const view = await app.getConversationView(
      token,
      Number(params.get("id")),
      params.get("servidor")?.trim() || HOME_WORKSPACE_ID,
    );
    return NextResponse.json(view);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar a conversa.");
  }
}
