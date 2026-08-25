import { writeChatCallEvent } from "@/domain/ChatCallEvent";
import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function finishDirectCallLog(
  chat: ChatRepository,
  token: string,
  messageId: number,
  durationSeconds: number,
) {
  if (!messageId) {
    throw new ApplicationError("Mensagem inválida.", 400);
  }

  return chat.editMessage(
    token,
    messageId,
    writeChatCallEvent({
      status: "ended",
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
    }),
  );
}
