import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    userId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const conversation = await app.openDirectMessage(
      token,
      Number(body?.userId),
    );
    return NextResponse.json(conversation);
  } catch (error) {
    return jsonError(error, "Não foi possível abrir a conversa.");
  }
}
