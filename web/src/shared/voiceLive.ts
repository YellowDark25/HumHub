import type { VoiceLiveEvent } from "@/domain/VoiceLive";
import type { VoiceOccupancyRoom, VoiceParticipant } from "@/domain/VoiceRoom";

export const VOICE_LIVE_POLL_MS = 10_000;
export const VOICE_LIVE_RECONNECT_MS = 30_000;

export function readVoiceLiveEvent(payload: unknown): VoiceLiveEvent | null {
  if (!isRecord(payload) || payload.type !== "nexchat.voiceOccupancy") {
    return null;
  }

  const room = readOccupancyRoom(payload);
  return room ? { type: "occupancy", room } : null;
}

export function applyVoiceLiveEvent(
  rooms: VoiceOccupancyRoom[],
  event: VoiceLiveEvent,
): VoiceOccupancyRoom[] {
  if (event.room.participants.length === 0) {
    return rooms.filter(
      (room) => room.conversationId !== event.room.conversationId,
    );
  }

  if (rooms.some((room) => room.conversationId === event.room.conversationId)) {
    return rooms.map((room) =>
      room.conversationId === event.room.conversationId ? event.room : room,
    );
  }

  return [...rooms, event.room];
}

function readOccupancyRoom(payload: Record<string, unknown>): VoiceOccupancyRoom | null {
  const conversationId = Number(payload.conversationId);
  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return null;
  }

  const kind = payload.kind === "dm" ? "dm" : payload.kind === "channel" ? "channel" : null;
  if (!kind) {
    return null;
  }

  return {
    conversationId,
    kind,
    name:
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : "Chamada",
    participants: Array.isArray(payload.participants)
      ? payload.participants.flatMap(readParticipant)
      : [],
  };
}

function readParticipant(payload: unknown): VoiceParticipant[] {
  if (!isRecord(payload)) {
    return [];
  }

  const userId = Number(payload.userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return [];
  }

  return [
    {
      userId,
      name:
        typeof payload.name === "string" && payload.name.trim()
          ? payload.name.trim()
          : "Usuário",
      imageUrl: typeof payload.imageUrl === "string" ? payload.imageUrl : "",
      joinedAt: Number(payload.joinedAt) || 0,
      isMicMuted: payload.isMicMuted === true,
      isDeafened: payload.isDeafened === true,
      isCameraOn: payload.isCameraOn === true,
      isScreenSharing: payload.isScreenSharing === true,
    },
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
