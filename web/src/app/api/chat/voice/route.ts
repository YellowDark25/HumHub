import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET() {
  try {
    const token = await requireAuthToken();
    const rooms = await app.listVoiceOccupancy(token);
    return NextResponse.json({ rooms });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar quem está em voz.");
  }
}
