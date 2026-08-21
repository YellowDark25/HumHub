import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET() {
  try {
    const token = await requireAuthToken();
    const invites = await app.listReceivedSpaceInvites(token);
    return NextResponse.json({ invites });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os convites.");
  }
}
