import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    userId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const person = await app.blockPerson(token, Number(body?.userId));
    return NextResponse.json(person);
  } catch (error) {
    return jsonError(error, "Não foi possível bloquear esta pessoa.");
  }
}
