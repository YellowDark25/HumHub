import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";

export async function POST(request: Request) {
  try {
    const token = await requireAuthToken();
    const input = await readPublishInput(request);
    const post = await app.publishPost(
      token,
      input.spaceId,
      input.message,
      input.files,
    );
    return NextResponse.json(post);
  } catch (error) {
    return jsonError(error, "Não foi possível publicar.");
  }
}

async function readPublishInput(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      spaceId: Number(form.get("spaceId")),
      message: String(form.get("message") ?? ""),
      files: form
        .getAll("files")
        .filter((item): item is File => item instanceof File && item.size > 0),
    };
  }

  const body = (await request.json().catch(() => null)) as {
    spaceId?: number;
    message?: string;
  } | null;

  return {
    spaceId: Number(body?.spaceId),
    message: body?.message ?? "",
    files: [] as File[],
  };
}
