import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  try {
    const token = await requireAuthToken();
    const body = (await request.json().catch(() => null)) as {
      conversationId?: number;
      isTyping?: boolean;
    } | null;

    await app.sendTyping(
      token,
      Number(body?.conversationId),
      body?.isTyping === true,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível avisar que você está digitando.");
  }
}
