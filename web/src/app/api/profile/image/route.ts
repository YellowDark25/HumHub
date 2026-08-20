import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    image?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const user = await app.updateProfileImage(token, body?.image ?? "");
    return NextResponse.json(user);
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar a foto.");
  }
}
