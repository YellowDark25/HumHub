import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

/**
 * Cria uma pasta no drive do espaço.
 * Lê nome e pasta pai do JSON e devolve a pasta criada.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    parentId?: number;
  } | null;

  try {
    const token = await requireAuthToken();
    const folder = await app.createSpaceFolder(
      token,
      Number((await params).id),
      Number(body?.parentId ?? 0),
      String(body?.name ?? ""),
    );
    return NextResponse.json(folder);
  } catch (error) {
    return jsonError(error, "Não foi possível criar a pasta.");
  }
}
