import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET() {
  try {
    const token = await requireAuthToken();
    return NextResponse.json(await app.listForwardTargets(token));
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os destinos.");
  }
}
