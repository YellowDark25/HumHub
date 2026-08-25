import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET(request: Request) {
  try {
    const token = await requireAuthToken();
    const params = new URL(request.url).searchParams;
    const messages = await app.listMessages(
      token,
      Number(params.get("id")),
      Number(params.get("since") ?? 0),
    );
    return NextResponse.json(messages);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as mensagens.");
  }
}

export async function PATCH(request: Request) {
  try {
    const token = await requireAuthToken();
    const body = (await request.json().catch(() => null)) as {
      messageId?: number;
      content?: string;
    } | null;
    const message = await app.editMessage(
      token,
      Number(body?.messageId),
      body?.content ?? "",
    );
    return NextResponse.json(message);
  } catch (error) {
    return jsonError(error, "Não foi possível editar a mensagem.");
  }
}

export async function DELETE(request: Request) {
  try {
    const token = await requireAuthToken();
    const body = (await request.json().catch(() => null)) as {
      messageId?: number;
    } | null;
    const message = await app.deleteMessage(token, Number(body?.messageId));
    return NextResponse.json(message);
  } catch (error) {
    return jsonError(error, "Não foi possível excluir a mensagem.");
  }
}
