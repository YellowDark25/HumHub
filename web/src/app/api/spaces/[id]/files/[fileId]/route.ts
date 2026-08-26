import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Exclui um arquivo enviado no espaço.
 * Lê o token, chama `deleteSpaceFile` e devolve `{ ok: true }` ou erro em JSON.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id, fileId } = await params;
    await app.deleteSpaceFile(token, Number(id), Number(fileId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir o arquivo.");
  }
}
