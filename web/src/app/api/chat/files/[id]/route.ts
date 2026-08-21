import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const file = await app.getChatFile(token, Number((await params).id));
    return new NextResponse(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    return jsonError(error, "Não foi possível abrir o arquivo.");
  }
}
