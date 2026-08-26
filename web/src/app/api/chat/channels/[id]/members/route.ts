import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Devolve o roster do canal para a lista lateral.
 * Autentica, chama listChannelMembers e responde `{ members }`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const members = await app.listChannelMembers(
      token,
      Number((await params).id),
    );
    return NextResponse.json({ members });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os membros.");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    userId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    await app.removeChannelMember(
      token,
      Number((await params).id),
      Number(body?.userId),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível remover o membro.");
  }
}
