import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    receivesNotifications?: boolean;
    showsOnDashboard?: boolean;
  } | null;

  try {
    const token = await requireAuthToken();
    const membership = await app.updateSpaceMembershipSettings(
      token,
      Number((await params).id),
      {
        receivesNotifications: body?.receivesNotifications,
        showsOnDashboard: body?.showsOnDashboard,
      },
    );
    return NextResponse.json(membership);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar as configurações do espaço.");
  }
}
