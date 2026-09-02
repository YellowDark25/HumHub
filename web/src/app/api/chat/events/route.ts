import { NextResponse } from "next/server";
import type { ChatEventFrequency, ChatEventLocationKind } from "@/domain/ChatEvent";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Lista os eventos futuros do servidor.
 * Lê spaceId da query e devolve a lista com a flag de criação.
 */
export async function GET(request: Request) {
  const spaceId = Number(new URL(request.url).searchParams.get("spaceId"));

  try {
    const token = await requireAuthToken();
    const list = await app.listSpaceEvents(token, spaceId);
    return NextResponse.json(list);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os eventos.");
  }
}

/**
 * Cria um evento no servidor.
 * Lê o FormData do assistente e grava assunto, local, data e imagem.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const image = form?.get("image");

  try {
    const token = await requireAuthToken();
    const created = await app.createSpaceEvent(token, {
      spaceId: Number(form?.get("spaceId") ?? 0),
      title: String(form?.get("title") ?? ""),
      description: String(form?.get("description") ?? ""),
      locationKind: String(form?.get("locationKind") ?? "") as ChatEventLocationKind,
      conversationId: Number(form?.get("conversationId") ?? 0) || null,
      locationText: String(form?.get("locationText") ?? ""),
      startsAt: String(form?.get("startsAt") ?? ""),
      frequency: String(form?.get("frequency") ?? "none") as ChatEventFrequency,
      image: image instanceof File && image.size > 0 ? image : null,
    });
    return NextResponse.json(created);
  } catch (error) {
    return jsonError(error, "Não foi possível criar o evento.");
  }
}
