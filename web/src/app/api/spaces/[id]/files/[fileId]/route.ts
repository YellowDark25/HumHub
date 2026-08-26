import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Baixa um arquivo do drive (origem=drive) ou do feed.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id, fileId } = await params;
    const origin = new URL(request.url).searchParams.get("origem");
    const file =
      origin === "drive"
        ? await app.getSpaceDriveFile(token, Number(id), Number(fileId))
        : await app.getPostFile(token, Number(fileId));

    return new NextResponse(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar o arquivo.");
  }
}

/**
 * Exclui um arquivo do drive ou a publicação do feed que o contém.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id, fileId } = await params;
    const origin = new URL(request.url).searchParams.get("origem");
    if (origin === "drive") {
      await app.deleteSpaceDriveFile(token, Number(id), Number(fileId));
    } else {
      await app.deleteSpaceFile(token, Number(id), Number(fileId));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir o arquivo.");
  }
}
