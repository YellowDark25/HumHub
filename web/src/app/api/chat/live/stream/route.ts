import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = await requireAuthToken();
    const conversationId = Number(new URL(request.url).searchParams.get("id"));
    const stream = await app.openChatLiveStream(token, conversationId);
    if (!stream) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(stream.body, {
      headers: {
        "Content-Type": stream.contentType,
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return jsonError(error, "Não foi possível abrir o canal do chat.");
  }
}
