import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const token = await requireAuthToken();
    const path = (await params).path.join("/");
    const search = new URL(request.url).search;
    const file = await app.getHumhubMedia(token, path, search);

    return new NextResponse(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar a imagem.");
  }
}
