import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    spaceId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    if (body?.spaceId) {
      await app.enableSpaceServer(token, Number(body.spaceId));
      return NextResponse.json({ id: Number(body.spaceId) });
    }

    const space = await app.createChatServer(token, body?.name ?? "");
    return NextResponse.json(space);
  } catch (error) {
    return jsonError(error, "Não foi possível criar o servidor.");
  }
}
