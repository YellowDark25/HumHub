import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
    currentPassword?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const account = await app.changeUsername(
      token,
      body?.username ?? "",
      body?.currentPassword ?? "",
    );
    return NextResponse.json(account);
  } catch (error) {
    return jsonError(error, "Não foi possível alterar o nome de usuário.");
  }
}
