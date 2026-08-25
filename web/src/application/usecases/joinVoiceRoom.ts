import {
  MAX_VOICE_PARTICIPANTS,
  occupancyRoomOf,
  type VoiceMediaState,
} from "@/domain/VoiceRoom";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { VoiceRoomRepository } from "../ports/VoiceRoomRepository";
import { getCurrentUser } from "./getCurrentUser";
import { publishVoiceOccupancy } from "./publishVoiceOccupancy";
import { requireVoiceChannel } from "./requireVoiceChannel";

export async function joinVoiceRoom(
  chat: ChatRepository,
  auth: AuthRepository,
  voice: VoiceRoomRepository,
  token: string,
  conversationId: number,
  media: VoiceMediaState,
) {
  const [user, room, conversation] = await Promise.all([
    getCurrentUser(auth, token),
    voice.list(conversationId),
    requireVoiceChannel(chat, token, conversationId),
  ]);
  const alreadyInRoom = room.participants.some(
    (participant) => participant.userId === user.id,
  );

  if (!alreadyInRoom && room.participants.length >= MAX_VOICE_PARTICIPANTS) {
    throw new ApplicationError("A sala de voz está cheia.", 409);
  }

  const session = await voice.createSession(conversationId, {
    userId: user.id,
    name: user.name,
    imageUrl: user.imageUrl,
    joinedAt: Date.now(),
    ...media,
  });
  await publishVoiceOccupancy(
    chat,
    token,
    occupancyRoomOf(conversation, session.room),
  );

  return session;
}
