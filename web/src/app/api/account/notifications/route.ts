import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET() {
  try {
    const token = await requireAuthToken();
    const preferences = await app.getNotificationPreferences(token);
    return NextResponse.json(preferences);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as notificações.");
  }
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    spaceIds?: number[];
    channels?: Record<string, { web?: boolean; email?: boolean }>;
  } | null;

  try {
    const token = await requireAuthToken();
    const preferences = await app.saveNotificationPreferences(token, {
      spaceIds: Array.isArray(body?.spaceIds) ? body.spaceIds.map(Number) : [],
      channels: readChannels(body?.channels),
    });
    return NextResponse.json(preferences);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar as notificações.");
  }
}

function readChannels(
  channels: Record<string, { web?: boolean; email?: boolean }> | undefined,
) {
  if (!channels) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(channels).map(([categoryId, channel]) => [
      categoryId,
      { web: Boolean(channel?.web), email: Boolean(channel?.email) },
    ]),
  );
}
