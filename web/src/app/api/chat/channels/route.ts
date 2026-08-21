import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireAuthToken } from "@/infrastructure/http/requireAuth";
import type { ChatChannelType } from "@/domain/Conversation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    channelType?: ChatChannelType;
    spaceId?: number | null;
    isPrivate?: boolean;
  } | null;

  try {
    const token = await requireAuthToken();
    const conversation = await app.createChannel(token, {
      name: body?.name ?? "",
      channelType: body?.channelType ?? "text",
      spaceId: body?.spaceId ?? null,
      isPrivate: Boolean(body?.isPrivate),
    });
    return NextResponse.json(conversation);
  } catch (error) {
    return jsonError(error, "Não foi possível criar o canal.");
  }
}
