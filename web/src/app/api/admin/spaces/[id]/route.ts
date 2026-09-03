import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Exclui um espaço pela API administrativa.
 * Lê o token da sessão, valida o id da rota e chama o caso de uso; devolve ok ou o erro em JSON.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id } = await params;
    await app.deleteAdminSpace(token, Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir o espaço.");
  }
}
