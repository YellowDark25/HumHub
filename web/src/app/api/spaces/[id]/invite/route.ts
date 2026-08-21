import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const users = await app.listSpaceInvitees(token, Number((await params).id));
    return NextResponse.json({ users });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os usuários.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    userIds?: number[];
    selectAllRegistered?: boolean;
    addWithoutInvite?: boolean;
    addAsDefaultSpace?: boolean;
  } | null;

  try {
    const token = await requireAuthToken();
    await app.inviteSpaceMembers(token, Number((await params).id), {
      userIds: Array.isArray(body?.userIds) ? body.userIds.map(Number) : [],
      selectAllRegistered: Boolean(body?.selectAllRegistered),
      addWithoutInvite: Boolean(body?.addWithoutInvite),
      addAsDefaultSpace: Boolean(body?.addAsDefaultSpace),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível enviar os convites.");
  }
}
