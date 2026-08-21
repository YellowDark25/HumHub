import { NextResponse } from "next/server";
import type { AdminGroupPermissionState } from "@/domain/AdminGroup";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    permissionId?: string;
    moduleId?: string;
    state?: AdminGroupPermissionState;
  } | null;

  try {
    const token = await requireAuthToken();
    const { id } = await params;
    const permissions = await app.setAdminGroupPermission(
      token,
      Number(id),
      body?.permissionId ?? "",
      body?.moduleId ?? "",
      body?.state ?? "default",
    );
    return NextResponse.json({ permissions });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar a permissão.");
  }
}
