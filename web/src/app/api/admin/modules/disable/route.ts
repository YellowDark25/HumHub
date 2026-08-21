import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    moduleId?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const modules = await app.disableAdminModule(token, body?.moduleId ?? "");
    return NextResponse.json(modules);
  } catch (error) {
    return jsonError(error, "Não foi possível desativar o módulo.");
  }
}
