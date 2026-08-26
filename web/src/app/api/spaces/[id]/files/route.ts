import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await requireAuthToken();
    const form = await request.formData();
    const files = form
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);
    const post = await app.uploadSpaceFiles(
      token,
      Number((await params).id),
      files,
      String(form.get("description") ?? ""),
    );
    return NextResponse.json(post);
  } catch (error) {
    return jsonError(error, "Não foi possível enviar os arquivos.");
  }
}
