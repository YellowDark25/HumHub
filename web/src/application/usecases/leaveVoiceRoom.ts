import { occupancyRoomOf } from "@/domain/VoiceRoom";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { VoiceRoomRepository } from "../ports/VoiceRoomRepository";
import { getCurrentUser } from "./getCurrentUser";
import { publishVoiceOccupancy } from "./publishVoiceOccupancy";
import { requireVoiceChannel } from "./requireVoiceChannel";

export async function leaveVoiceRoom(
  chat: ChatRepository,
  auth: AuthRepository,
  voice: VoiceRoomRepository,
  token: string,
  conversationId: number,
) {
  const [conversation, user] = await Promise.all([
    requireVoiceChannel(chat, token, conversationId),
    getCurrentUser(auth, token),
  ]);
  const room = await voice.removeParticipant(conversationId, user.id);
  await publishVoiceOccupancy(chat, token, occupancyRoomOf(conversation, room));

  return room;
}
