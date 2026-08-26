import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Abre uma pasta do drive do espaço.
 * Lê `folderId` da query (0 = raiz) e devolve pastas + arquivos.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const folderId = Number(new URL(request.url).searchParams.get("folderId") ?? 0);
    const drive = await app.getSpaceDrive(
      token,
      Number((await params).id),
      Number.isFinite(folderId) ? folderId : 0,
    );
    return NextResponse.json(drive);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os arquivos.");
  }
}
