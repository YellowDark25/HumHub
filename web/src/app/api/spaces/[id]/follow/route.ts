import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const space = await app.followSpace(token, Number((await params).id));
    return NextResponse.json(space);
  } catch (error) {
    return jsonError(error, "Não foi possível seguir este espaço.");
  }
}
