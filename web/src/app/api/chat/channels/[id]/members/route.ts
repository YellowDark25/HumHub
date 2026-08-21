import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

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
