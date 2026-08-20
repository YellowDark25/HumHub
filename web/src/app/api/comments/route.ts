import { NextResponse } from "next/server";
import { ApplicationError } from "@/application/errors";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET(request: Request) {
  const postId = Number(new URL(request.url).searchParams.get("postId"));

  try {
    const token = await requireAuthToken();
    if (!postId) {
      throw new ApplicationError("Publicação inválida.", 400);
    }

    const comments = await app.listComments(token, postId);
    return NextResponse.json(comments);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os comentários.");
  }
}

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
