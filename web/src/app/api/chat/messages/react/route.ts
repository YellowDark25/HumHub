import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  try {
    const token = await requireAuthToken();
    const body = (await request.json().catch(() => null)) as {
      messageId?: number;
      emoji?: string;
    } | null;
    const result = await app.reactToMessage(
      token,
      Number(body?.messageId),
      body?.emoji ?? "",
    );
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error, "Não foi possível reagir à mensagem.");
  }
}
