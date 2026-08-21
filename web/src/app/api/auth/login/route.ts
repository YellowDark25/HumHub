import { NextResponse } from "next/server";
import { isForbidden } from "@/application/errors";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { setAuthToken } from "@/infrastructure/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;

  try {
    const result = await app.login(body?.username ?? "", body?.password ?? "");
    await setAuthToken(result.token, result.expiresInSeconds);
    try {
      await app.getCurrentUser(result.token);
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (isForbidden(error)) {
        return NextResponse.json({ ok: true, mustChangePassword: true });
      }

      throw error;
    }
  } catch (error) {
    return jsonError(error, "Não foi possível conectar ao HumHub.");
  }
}
