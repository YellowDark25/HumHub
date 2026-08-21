import type { VoiceMediaState } from "@/domain/VoiceRoom";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { VoiceRoomRepository } from "../ports/VoiceRoomRepository";
import { getCurrentUser } from "./getCurrentUser";
import { requireVoiceChannel } from "./requireVoiceChannel";

export async function heartbeatVoiceRoom(
  chat: ChatRepository,
  auth: AuthRepository,
  voice: VoiceRoomRepository,
  token: string,
  conversationId: number,
  media: VoiceMediaState,
) {
  await requireVoiceChannel(chat, token, conversationId);
  const user = await getCurrentUser(auth, token);
  return voice.heartbeat(conversationId, user.id, media);
}
