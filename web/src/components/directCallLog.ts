import type { ChatMessage } from "@/domain/ChatMessage";
import { readApiError } from "@/shared/readApiError";
import { publishChatMessage } from "./chatMessageEvents";

type ActiveCallLog = {
  conversationId: number;
  messageId: number;
  startedAt: number;
};

let activeLog: ActiveCallLog | null = null;

export async function recordDirectCallStart(conversationId: number) {
  if (activeLog?.conversationId === conversationId) {
    return;
  }

  try {
    const message = await startDirectCallLogApi(conversationId);
    activeLog = {
      conversationId,
      messageId: message.id,
      startedAt: Date.now(),
    };
    publishChatMessage(conversationId, message);
  } catch (error) {
    console.error("Falha ao registrar o início da chamada.", error);
  }
}

export async function recordDirectCallEnd(options?: { keepalive?: boolean }) {
  const current = activeLog;
  if (!current) {
    return;
  }

  activeLog = null;
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.now() - current.startedAt) / 1000),
  );

  try {
    const message = await finishDirectCallLogApi(
      current.messageId,
      durationSeconds,
      options,
    );
    if (message) {
      publishChatMessage(current.conversationId, message);
    }
  } catch (error) {
    console.error("Falha ao registrar o fim da chamada.", error);
  }
}

async function startDirectCallLogApi(conversationId: number): Promise<ChatMessage> {
  const response = await fetch("/api/chat/call-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível registrar a chamada."));
  }

  return response.json() as Promise<ChatMessage>;
}

async function finishDirectCallLogApi(
  messageId: number,
  durationSeconds: number,
  options?: { keepalive?: boolean },
): Promise<ChatMessage | null> {
  const response = await fetch("/api/chat/call-log", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, durationSeconds }),
    keepalive: options?.keepalive,
  });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível encerrar o registro da chamada."),
    );
  }

  if (options?.keepalive) {
    return null;
  }

  return response.json() as Promise<ChatMessage>;
}
