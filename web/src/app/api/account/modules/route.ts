import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET() {
  try {
    const token = await requireAuthToken();
    const modules = await app.listAccountModules(token);
    return NextResponse.json(modules);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os módulos.");
  }
}
