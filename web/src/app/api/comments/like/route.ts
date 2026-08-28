import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Alterna a curtida do comentário autenticado.
 * Lê commentId no corpo; grava pelo caso de uso e devolve liked + likeCount.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    commentId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const like = await app.toggleCommentLike(token, Number(body?.commentId));
    return NextResponse.json(like);
  } catch (error) {
    return jsonError(error, "Não foi possível curtir.");
  }
}
