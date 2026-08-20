import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST() {
  try {
    const token = await requireAuthToken();
    const preferences = await app.resetNotificationPreferences(token);
    return NextResponse.json(preferences);
  } catch (error) {
    return jsonError(error, "Não foi possível redefinir as notificações.");
  }
}
