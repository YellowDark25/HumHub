import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await request.json().catch(() => null)) as {
    status?: "active" | "disabled";
  } | null;

  try {
    const token = await requireAuthToken();
    const { id } = await params;
    const user = await app.setAdminUserStatus(
      token,
      Number(id),
      body?.status === "disabled" ? "disabled" : "active",
    );
    return NextResponse.json(user);
  } catch (error) {
    return jsonError(error, "Não foi possível alterar o status do usuário.");
  }
}
