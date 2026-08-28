import { NextResponse } from "next/server";
import { ApplicationError } from "@/application/errors";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Lista uma página de comentários do post autenticado.
 * Lê postId e page na query; devolve a página (até 50) com hasMore.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const postId = Number(url.searchParams.get("postId"));
  const page = Number(url.searchParams.get("page") ?? 1);

  try {
    const token = await requireAuthToken();
    if (!postId) {
      throw new ApplicationError("Publicação inválida.", 400);
    }

    const comments = await app.listComments(token, postId, page);
    return NextResponse.json(comments);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os comentários.");
  }
}

/**
 * Publica um comentário no post.
 * Lê postId e message no corpo; grava pelo caso de uso e devolve o comentário.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    postId?: number;
    message?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const comment = await app.addComment(
      token,
      Number(body?.postId),
      body?.message ?? "",
    );
    return NextResponse.json(comment);
  } catch (error) {
    return jsonError(error, "Não foi possível comentar.");
  }
}
