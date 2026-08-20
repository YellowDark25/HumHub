import { NextResponse } from "next/server";
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível conectar ao HumHub.");
  }
}
