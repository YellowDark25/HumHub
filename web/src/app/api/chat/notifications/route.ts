import { NextResponse } from "next/server";
import type { ChatNotificationPreferencePatch } from "@/domain/ChatNotificationPreference";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET(request: Request) {
  try {
    const token = await requireAuthToken();
    const spaceId = Number(new URL(request.url).searchParams.get("spaceId"));
    const preference = await app.getServerNotificationPreference(token, spaceId);
    return NextResponse.json(preference);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as preferências.");
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | ChatNotificationPreferencePatch
    | null;

  try {
    const token = await requireAuthToken();
    const preference = await app.saveServerNotificationPreference(token, {
      spaceId: Number(body?.spaceId),
      level: body?.level,
      muteDuration: body?.muteDuration,
    });
    return NextResponse.json(preference);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar as preferências.");
  }
}
