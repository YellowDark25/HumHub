import { canJoinVoice } from "@/domain/Conversation";
import type { VoiceCallKind, VoiceOccupancyRoom } from "@/domain/VoiceRoom";
import type { ChatRepository } from "../ports/ChatRepository";
import type { VoiceRoomRepository } from "../ports/VoiceRoomRepository";

export async function listVoiceOccupancy(
  chat: ChatRepository,
  voice: VoiceRoomRepository,
  token: string,
): Promise<VoiceOccupancyRoom[]> {
  const lists = await chat.listConversations(token);
  const allowed = new Map<number, { kind: VoiceCallKind; name: string }>();

  for (const conversation of [...lists.channels, ...lists.dms]) {
    if (!canJoinVoice(conversation)) {
      continue;
    }

    allowed.set(conversation.id, {
      kind: conversation.kind === "dm" ? "dm" : "channel",
      name: conversation.name,
    });
  }

  return (await voice.listAll()).flatMap((room) => {
    const meta = allowed.get(room.conversationId);
    return meta ? [{ ...room, ...meta }] : [];
  });
}
