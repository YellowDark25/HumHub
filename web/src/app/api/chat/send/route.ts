import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  try {
    const token = await requireAuthToken();
    const input = await readSendInput(request);
    const message = await app.sendMessage(
      token,
      input.conversationId,
      input.content,
      input.files,
      input.replyToId,
    );
    return NextResponse.json(message);
  } catch (error) {
    return jsonError(error, "Não foi possível enviar a mensagem.");
  }
}

async function readSendInput(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      conversationId: Number(form.get("conversationId")),
      content: String(form.get("content") ?? ""),
      files: form
        .getAll("files")
        .filter((item): item is File => item instanceof File && item.size > 0),
      replyToId: Number(form.get("replyToId") ?? 0),
    };
  }

  const body = (await request.json().catch(() => null)) as {
    conversationId?: number;
    content?: string;
    replyToId?: number;
  } | null;

  return {
    conversationId: Number(body?.conversationId),
    content: body?.content ?? "",
    files: [] as File[],
    replyToId: Number(body?.replyToId ?? 0),
  };
}
