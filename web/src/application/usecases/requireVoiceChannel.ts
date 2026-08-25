import { canJoinVoice, type Conversation } from "@/domain/Conversation";
import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export async function requireVoiceChannel(
  chat: ChatRepository,
  token: string,
  conversationId: number,
): Promise<Conversation> {
  if (!conversationId) {
    throw new ApplicationError("Canal inválido.", 400);
  }

  const lists = await chat.listConversations(token);
  const current = [
    ...lists.channels,
    ...lists.dms,
    ...lists.pendingInvites,
  ].find((item) => item.id === conversationId);

  if (!current) {
    throw new ApplicationError("Conversa não encontrada.", 404);
  }

  if (!canJoinVoice(current)) {
    throw new ApplicationError("Esta conversa não permite chamada.", 400);
  }

  return current;
}
