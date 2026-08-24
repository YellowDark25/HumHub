export const VOICE_ROOM_NAME_PREFIX = "nexchat-voice-";
export const VOICE_TOKEN_TTL = "6h";

export function liveKitRoomName(conversationId: number): string {
  return `${VOICE_ROOM_NAME_PREFIX}${conversationId}`;
}

export function conversationIdFromLiveKitRoom(name: string): number | null {
  if (!name.startsWith(VOICE_ROOM_NAME_PREFIX)) {
    return null;
  }

  const conversationId = Number(name.slice(VOICE_ROOM_NAME_PREFIX.length));
  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return null;
  }

  return conversationId;
}
