import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { readProfileFieldInput } from "./readProfileFieldInput";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  try {
    const token = await requireAuthToken();
    const field = await app.createAdminProfileField(
      token,
      readProfileFieldInput(body),
    );
    return NextResponse.json(field);
  } catch (error) {
    return jsonError(error, "Não foi possível criar o campo.");
  }
}
