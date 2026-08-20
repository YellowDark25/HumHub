import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function PATCH() {
  try {
    const token = await requireAuthToken();
    await app.markAllNotificationsAsSeen(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível marcar as notificações como lidas.");
  }
}
