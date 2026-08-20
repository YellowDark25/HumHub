import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    conversationId?: number;
    content?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const message = await app.sendMessage(
      token,
      Number(body?.conversationId),
      body?.content ?? "",
    );
    return NextResponse.json(message);
  } catch (error) {
    return jsonError(error, "Não foi possível enviar a mensagem.");
  }
}
