import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { getPublicAppUrl } from "@/infrastructure/config";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Callback do OAuth Google: troca o code, grava o vínculo e volta às Integrações.
 * Erros voltam para a mesma seção com ?google=erro.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const settings = `${getPublicAppUrl()}/configuracoes?secao=integracoes`;

  try {
    const token = await requireAuthToken();
    await app.finishGoogleConnect(token, code, state);
    return NextResponse.redirect(`${settings}&google=ok`);
  } catch {
    return NextResponse.redirect(`${settings}&google=erro`);
  }
}
