import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    await app.changePassword(
      token,
      body?.currentPassword ?? "",
      body?.newPassword ?? "",
      body?.newPasswordConfirm ?? "",
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível alterar a senha.");
  }
}
