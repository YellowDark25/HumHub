import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { clearAuthToken } from "@/infrastructure/session";

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    currentPassword?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    await app.deleteAccount(token, body?.currentPassword ?? "");
    await clearAuthToken();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível apagar a conta.");
  }
}
