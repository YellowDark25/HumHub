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
