import type { ChatRepository } from "../ports/ChatRepository";
import type { VoiceRoomRepository } from "../ports/VoiceRoomRepository";
import { requireVoiceChannel } from "./requireVoiceChannel";

export async function listVoiceRoom(
  chat: ChatRepository,
  voice: VoiceRoomRepository,
  token: string,
  conversationId: number,
) {
  await requireVoiceChannel(chat, token, conversationId);
  return voice.list(conversationId);
}
