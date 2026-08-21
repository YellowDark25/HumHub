import { NextResponse } from "next/server";
import { ApplicationError } from "@/application/errors";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

type InviteAction = "accept" | "decline";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    action?: InviteAction;
  } | null;

  try {
    const token = await requireAuthToken();
    const spaceId = Number((await params).id);
    const action = readAction(body?.action);
    if (action === "accept") {
      await app.acceptSpaceInvite(token, spaceId);
    } else {
      await app.declineSpaceInvite(token, spaceId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar o convite.");
  }
}

function readAction(action: unknown): InviteAction {
  if (action === "accept" || action === "decline") {
    return action;
  }

  throw new ApplicationError("Ação inválida.", 400);
}
