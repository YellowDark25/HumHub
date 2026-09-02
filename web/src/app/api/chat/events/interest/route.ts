import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Alterna o interesse do usuário no evento.
 * Lê eventId do JSON e devolve o evento atualizado.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    eventId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const event = await app.toggleSpaceEventInterest(
      token,
      Number(body?.eventId),
    );
    return NextResponse.json(event);
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar o interesse.");
  }
}
