import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    newPassword?: string;
    newPasswordConfirm?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    await app.completeRequiredPasswordChange(
      token,
      body?.newPassword ?? "",
      body?.newPasswordConfirm ?? "",
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível definir a nova senha.");
  }
}
