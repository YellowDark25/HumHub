import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    spaceId?: number;
    message?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const post = await app.publishPost(
      token,
      Number(body?.spaceId),
      body?.message ?? "",
    );
    return NextResponse.json(post);
  } catch (error) {
    return jsonError(error, "Não foi possível publicar.");
  }
}
