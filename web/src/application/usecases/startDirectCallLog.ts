import { writeChatCallEvent } from "@/domain/ChatCallEvent";
import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function startDirectCallLog(
  chat: ChatRepository,
  token: string,
  conversationId: number,
) {
  if (!conversationId) {
    throw new ApplicationError("Conversa inválida.", 400);
  }

  return chat.sendMessage(
    token,
    conversationId,
    writeChatCallEvent({ status: "started", durationSeconds: 0 }),
  );
}
