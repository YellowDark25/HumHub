import { after, NextResponse } from "next/server";
import { app } from "@/infrastructure/composition";
import { jsonError } from "@/infrastructure/http/jsonError";
import { requireServiceSecret } from "@/infrastructure/http/requireServiceSecret";
import type { SecretaryTurnInput } from "@/domain/SecretaryTurn";

export const maxDuration = 60;

/**
 * Recebe o recado disparado pelo HumHub e processa o turno da secretária.
 * Autentica pelo header X-Kaizzen-Secret; devolve 202 e conclui o turno depois.
 */
export async function POST(request: Request) {
  try {
    requireServiceSecret(request);
    const input = await readTurnInput(request);
    after(async () => {
      try {
        console.info("Turno da secretária iniciado:", {
          conversationId: input.conversationId,
          messageId: input.messageId,
          userId: input.userId,
          hasContent: Boolean(input.content.trim()),
          audioFileId: input.audioFileId,
        });
        await app.handleSecretaryTurn(input);
        console.info("Turno da secretária concluído:", {
          conversationId: input.conversationId,
          messageId: input.messageId,
        });
      } catch (error) {
        console.error("Turno da secretária falhou:", error);
      }
    });
    return NextResponse.json({ ok: true }, { status: 202 });
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
