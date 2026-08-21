import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id } = await params;
    await app.deleteAdminUser(token, Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir o usuário.");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    firstName?: string;
    lastName?: string;
    title?: string;
    username?: string;
    email?: string;
    password?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const { id } = await params;
    const user = await app.updateAdminUser(token, Number(id), {
      firstName: body?.firstName ?? "",
      lastName: body?.lastName ?? "",
      title: body?.title ?? "",
      username: body?.username ?? "",
      email: body?.email ?? "",
      password: body?.password ?? "",
    });
    return NextResponse.json(user);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar o usuário.");
  }
}
