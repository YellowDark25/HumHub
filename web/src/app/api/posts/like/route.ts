import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Alterna a curtida da publicação autenticada.
 * Lê postId no corpo; grava pelo caso de uso e devolve liked + likeCount.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    postId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const like = await app.togglePostLike(token, Number(body?.postId));
    return NextResponse.json(like);
  } catch (error) {
    return jsonError(error, "Não foi possível curtir.");
  }
}
