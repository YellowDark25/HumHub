import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    conversationId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const message = await app.startDirectCallLog(
      token,
      Number(body?.conversationId),
    );
    return NextResponse.json(message);
  } catch (error) {
    return jsonError(error, "Não foi possível registrar a chamada.");
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    messageId?: number;
    durationSeconds?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const message = await app.finishDirectCallLog(
      token,
      Number(body?.messageId),
      Number(body?.durationSeconds),
    );
    return NextResponse.json(message);
  } catch (error) {
    return jsonError(error, "Não foi possível encerrar o registro da chamada.");
  }
}
