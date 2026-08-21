import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    baseUrl?: string;
    defaultLanguage?: string;
    timeZone?: string;
    maintenanceMode?: boolean;
  } | null;

  try {
    const token = await requireAuthToken();
    const settings = await app.saveAdminSettings(token, {
      name: body?.name ?? "",
      baseUrl: body?.baseUrl ?? "",
      defaultLanguage: body?.defaultLanguage ?? "",
      timeZone: body?.timeZone ?? "",
      maintenanceMode: Boolean(body?.maintenanceMode),
    });
    return NextResponse.json(settings);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar as configurações.");
  }
}
