import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  try {
    const token = await requireAuthToken();
    const body = (await request.json().catch(() => null)) as {
      messageId?: number;
      conversationIds?: number[];
      userIds?: number[];
      comment?: string;
    } | null;
    const messages = await app.forwardMessage(token, {
      messageId: Number(body?.messageId),
      conversationIds: body?.conversationIds ?? [],
      userIds: body?.userIds ?? [],
      comment: body?.comment ?? "",
    });
    return NextResponse.json(messages);
  } catch (error) {
    return jsonError(error, "Não foi possível encaminhar a mensagem.");
  }
}
