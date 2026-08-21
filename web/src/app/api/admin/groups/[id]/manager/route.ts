import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    userId?: number;
    isManager?: boolean;
  } | null;

  try {
    const token = await requireAuthToken();
    const { id } = await params;
    const members = await app.setAdminGroupMemberManager(
      token,
      Number(id),
      Number(body?.userId),
      Boolean(body?.isManager),
    );
    return NextResponse.json({ members });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar o gerente.");
  }
}
