import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { readProfileFieldInput } from "../readProfileFieldInput";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  try {
    const token = await requireAuthToken();
    const { id } = await params;
    const field = await app.updateAdminProfileField(
      token,
      Number(id),
      readProfileFieldInput(body),
    );
    return NextResponse.json(field);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar o campo.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id } = await params;
    await app.deleteAdminProfileField(token, Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir o campo.");
  }
}
