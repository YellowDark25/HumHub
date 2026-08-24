import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET() {
  try {
    const token = await requireAuthToken();
    const unseenCount = await app.countUnseenNotifications(token);
    return NextResponse.json({ unseenCount });
  } catch (error) {
    return jsonError(error, "Não foi possível contar as notificações.");
  }
}
