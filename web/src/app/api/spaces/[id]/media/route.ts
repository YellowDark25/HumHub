import { NextResponse } from "next/server";
import type { SpaceImageKind } from "@/application/usecases/updateSpaceImage";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    kind?: SpaceImageKind;
    image?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const space = await app.updateSpaceImage(
      token,
      Number(id),
      body?.kind as SpaceImageKind,
      body?.image ?? "",
    );
    return NextResponse.json(space);
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar a imagem do espaço.");
  }
}

