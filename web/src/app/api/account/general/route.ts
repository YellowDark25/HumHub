import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    language?: string;
    timeZone?: string;
    visibility?: number;
    tags?: string[] | string;
  } | null;

  try {
    const token = await requireAuthToken();
    const account = await app.updateAccountGeneral(token, {
      language: body?.language ?? "",
      timeZone: body?.timeZone ?? "",
      visibility: Number(body?.visibility ?? 1),
      tags: readTags(body?.tags),
    });
    return NextResponse.json(account);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar as configurações.");
  }
}

function readTags(tags: string[] | string | undefined): string[] {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags !== "string") {
    return [];
  }

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
