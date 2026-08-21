import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import { readProfileCategoryInput } from "./readProfileCategoryInput";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  try {
    const token = await requireAuthToken();
    const category = await app.createAdminProfileCategory(
      token,
      readProfileCategoryInput(body),
    );
    return NextResponse.json(category);
  } catch (error) {
    return jsonError(error, "Não foi possível criar a categoria.");
  }
}
