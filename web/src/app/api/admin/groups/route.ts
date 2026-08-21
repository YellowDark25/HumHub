import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { readGroupInput } from "./readGroupInput";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  try {
    const token = await requireAuthToken();
    const group = await app.createAdminGroup(token, readGroupInput(body));
    return NextResponse.json(group);
  } catch (error) {
    return jsonError(error, "Não foi possível criar o grupo.");
  }
}
