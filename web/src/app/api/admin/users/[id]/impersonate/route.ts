import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { setAuthToken } from "@/infrastructure/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const { id } = await params;
    const result = await app.impersonateAdminUser(token, Number(id));
    await setAuthToken(result.token, result.expiresInSeconds);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível representar este usuário.");
  }
}
