import { NextResponse } from "next/server";
import {
  emptyAccountProfile,
  type AccountProfile,
} from "@/domain/Account";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | Partial<AccountProfile>
    | null;

  try {
    const token = await requireAuthToken();
    const account = await app.updateAccountProfile(token, {
      ...emptyAccountProfile(),
      ...body,
    });
    return NextResponse.json(account);
  } catch (error) {
    return jsonError(error, "Não foi possível salvar o perfil.");
  }
}
