import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { readProfileCategoryInput } from "../readProfileCategoryInput";

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
    const category = await app.updateAdminProfileCategory(
      token,
      Number(id),
      readProfileCategoryInput(body),
    );
    return NextResponse.json(category);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar a categoria.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id } = await params;
    await app.deleteAdminProfileCategory(token, Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir a categoria.");
  }
}
