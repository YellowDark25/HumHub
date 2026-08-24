import type { ChatRepository } from "../ports/ChatRepository";
import type { VoiceRoomRepository } from "../ports/VoiceRoomRepository";

export async function listVoiceOccupancy(
  chat: ChatRepository,
  voice: VoiceRoomRepository,
  token: string,
) {
  const lists = await chat.listConversations(token);
  const allowed = new Set(
    lists.channels
      .filter((channel) => channel.channelType === "voice")
      .map((channel) => channel.id),
  );

  return (await voice.listAll()).filter((room) =>
    allowed.has(room.conversationId),
  );
}
