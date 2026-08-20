import { NextResponse } from "next/server";
import { ApplicationError } from "@/application/errors";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET(request: Request) {
  try {
    const token = await requireAuthToken();
    const notifications = await app.listNotifications(token, {
      limit: readLimit(request.url),
    });
    return NextResponse.json(notifications);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as notificações.");
  }
}

function readLimit(url: string): number | undefined {
  const raw = new URL(url).searchParams.get("limit");
  if (!raw) {
    return undefined;
  }

  const limit = Number(raw);
  if (!Number.isFinite(limit)) {
    throw new ApplicationError("Limite inválido.", 400);
  }

  return limit;
}
