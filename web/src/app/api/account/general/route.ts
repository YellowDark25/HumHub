import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    language?: string;
    timeZone?: string;
    visibility?: number;
    tags?: string[];
    hideOnlineStatus?: boolean;
    hideTourPanel?: boolean;
    markdownEditorMode?: "rich" | "plain";
    blockedUserIds?: number[];
  } | null;

  try {
    const token = await requireAuthToken();
    const settings = await app.updateAccountGeneral(token, {
      language: body?.language ?? "",
      timeZone: body?.timeZone ?? "",
      visibility: Number(body?.visibility ?? 1),
      tags: Array.isArray(body?.tags) ? body.tags : [],
      hideOnlineStatus: Boolean(body?.hideOnlineStatus),
      hideTourPanel: Boolean(body?.hideTourPanel),
      markdownEditorMode: body?.markdownEditorMode === "plain" ? "plain" : "rich",
      blockedUserIds: Array.isArray(body?.blockedUserIds)
        ? body.blockedUserIds
        : [],
    });
    return NextResponse.json(settings);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar as configurações.");
  }
}
