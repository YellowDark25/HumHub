import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Status do vínculo Google e início do OAuth.
 * GET devolve connected/email; POST devolve a URL de consentimento.
 */
export async function GET() {
  try {
    const token = await requireAuthToken();
    const status = await app.getGoogleAccountStatus(token);
    return NextResponse.json(status);
  } catch (error) {
    return jsonError(error, "Não foi possível ler o vínculo Google.");
  }
}

/**
 * Monta a URL do Google para o usuário autenticado.
 */
export async function POST() {
  try {
    const token = await requireAuthToken();
    const started = await app.startGoogleConnect(token);
    return NextResponse.json(started);
  } catch (error) {
    return jsonError(error, "Não foi possível iniciar o vínculo Google.");
  }
}

/**
 * Remove o refresh token gravado.
 */
export async function DELETE() {
  try {
    const token = await requireAuthToken();
    await app.disconnectGoogleAccount(token);
    return NextResponse.json({ connected: false, email: "" });
  } catch (error) {
    return jsonError(error, "Não foi possível desconectar o Google.");
  }
}
