import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
  } | null;

  try {
    const token = await requireAuthToken();
    const user = await app.createAdminUser(token, {
      firstName: body?.firstName ?? "",
      lastName: body?.lastName ?? "",
      username: body?.username ?? "",
      email: body?.email ?? "",
      password: body?.password ?? "",
    });
    return NextResponse.json(user);
  } catch (error) {
    return jsonError(error, "Não foi possível criar o usuário.");
  }
}
