import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET() {
  try {
    const token = await requireAuthToken();
    const spaces = await app.listSpaces(token);
    return NextResponse.json(spaces);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os espaços.");
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    description?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const space = await app.createSpace(
      token,
      body?.name ?? "",
      body?.description ?? "",
    );
    return NextResponse.json(space);
  } catch (error) {
    return jsonError(error, "Não foi possível criar o espaço.");
  }
}
