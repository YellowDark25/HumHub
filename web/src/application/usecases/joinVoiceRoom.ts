import { MAX_VOICE_PARTICIPANTS, type VoiceMediaState } from "@/domain/VoiceRoom";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { VoiceRoomRepository } from "../ports/VoiceRoomRepository";
import { getCurrentUser } from "./getCurrentUser";
import { requireVoiceChannel } from "./requireVoiceChannel";

export async function joinVoiceRoom(
  chat: ChatRepository,
  auth: AuthRepository,
  voice: VoiceRoomRepository,
  token: string,
  conversationId: number,
  media: VoiceMediaState,
) {
  await requireVoiceChannel(chat, token, conversationId);
  const user = await getCurrentUser(auth, token);
  const room = await voice.list(conversationId);
  const alreadyInRoom = room.participants.some(
    (participant) => participant.userId === user.id,
  );

  if (!alreadyInRoom && room.participants.length >= MAX_VOICE_PARTICIPANTS) {
    throw new ApplicationError("A sala de voz está cheia.", 409);
  }

  return voice.createSession(conversationId, {
    userId: user.id,
    name: user.name,
    imageUrl: user.imageUrl,
    joinedAt: Date.now(),
    ...media,
  });
}
