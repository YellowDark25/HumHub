import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Devolve o id do deploy atual para o cliente comparar com o que carregou.
 * Sem cache: após um publish no Vercel a resposta precisa ser a nova versão.
 */
export async function GET() {
  try {
    const release = app.getAppRelease();
    return NextResponse.json(release, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return jsonError(error, "Não foi possível obter a versão do sistema.");
  }
}
