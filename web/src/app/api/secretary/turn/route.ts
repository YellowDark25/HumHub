import { NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireServiceSecret } from "@/infrastructure/http/requireServiceSecret";
import type { SecretaryTurnInput } from "@/domain/SecretaryTurn";

export const maxDuration = 60;

/**
 * Recebe o recado disparado pelo HumHub e processa o turno da secretária.
 * Autentica pelo header X-Kaizzen-Secret; responde na mesma DM.
 */
export async function POST(request: Request) {
  try {
    requireServiceSecret(request);
    const input = await readTurnInput(request);
    await app.handleSecretaryTurn(input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível processar o recado da secretária.");
  }
}

/**
 * Lê conversationId, messageId, userId, content e audioFileId do corpo.
 */
async function readTurnInput(request: Request): Promise<SecretaryTurnInput> {
  const body = (await request.json().catch(() => null)) as {
    conversationId?: number;
    messageId?: number;
    userId?: number;
    content?: string;
    audioFileId?: number | null;
  } | null;

  return {
    conversationId: Number(body?.conversationId ?? 0),
    messageId: Number(body?.messageId ?? 0),
    userId: Number(body?.userId ?? 0),
    content: typeof body?.content === "string" ? body.content : "",
    audioFileId: body?.audioFileId ? Number(body.audioFileId) : null,
  };
}
