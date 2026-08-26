import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Exclui uma pasta do drive e o conteúdo interno.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; folderId: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id, folderId } = await params;
    await app.deleteSpaceFolder(token, Number(id), Number(folderId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir a pasta.");
  }
}
