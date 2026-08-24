import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET(request: Request) {
  try {
    const token = await requireAuthToken();
    const conversationId = Number(
      new URL(request.url).searchParams.get("conversationId"),
    );
    const topics = await app.listTopics(token, conversationId);
    return NextResponse.json(topics);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os tópicos.");
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    conversationId?: number;
    name?: string;
    isPrivate?: boolean;
    message?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const conversation = await app.createTopic(token, {
      conversationId: Number(body?.conversationId),
      name: body?.name ?? "",
      isPrivate: Boolean(body?.isPrivate),
      message: body?.message ?? "",
    });
    return NextResponse.json(conversation);
  } catch (error) {
    return jsonError(error, "Não foi possível criar o tópico.");
  }
}
