import { ApplicationError } from "@/application/errors";
import type { VoiceRoomRepository } from "@/application/ports/VoiceRoomRepository";
import type {
  VoiceParticipant,
  VoiceRoom,
  VoiceSession,
} from "@/domain/VoiceRoom";
import {
  AccessToken,
  RoomServiceClient,
  ServerError,
  TrackSource,
  type ParticipantInfo,
  type TrackInfo,
} from "livekit-server-sdk";
import {
  getLiveKitApiKey,
  getLiveKitApiSecret,
  getLiveKitHttpUrl,
  getPublicLiveKitUrl,
} from "../config";
import {
  conversationIdFromLiveKitRoom,
  liveKitRoomName,
  VOICE_TOKEN_TTL,
} from "./constants";

export class LiveKitVoiceRoomRepository implements VoiceRoomRepository {
  private client: RoomServiceClient | null = null;

  async createSession(
    conversationId: number,
    participant: VoiceParticipant,
  ): Promise<VoiceSession> {
    const token = await issueToken(conversationId, participant);
    const room = await this.list(conversationId);
    return {
      url: getPublicLiveKitUrl(),
      token,
      room: withJoiningParticipant(room, participant),
    };
  }

  async list(conversationId: number): Promise<VoiceRoom> {
    try {
      const people = await this.rooms().listParticipants(
        liveKitRoomName(conversationId),
      );
      return {
        conversationId,
        participants: people
          .map(mapParticipant)
          .filter((item): item is VoiceParticipant => item !== null),
      };
    } catch (error) {
      if (isMissingRoom(error)) {
        return { conversationId, participants: [] };
      }

      throw wrapLiveKitError(error, "Não foi possível carregar a sala de voz.");
    }
  }

  async listAll(): Promise<VoiceRoom[]> {
    try {
      const rooms = await this.rooms().listRooms();
      const ids = rooms
        .map((room) => conversationIdFromLiveKitRoom(room.name))
        .filter((id): id is number => id !== null);
      return Promise.all(ids.map((conversationId) => this.list(conversationId)));
    } catch (error) {
      throw wrapLiveKitError(
        error,
        "Não foi possível carregar quem está em voz.",
      );
    }
  }

  async removeParticipant(
    conversationId: number,
    userId: number,
  ): Promise<VoiceRoom> {
    try {
      await this.rooms().removeParticipant(
        liveKitRoomName(conversationId),
        String(userId),
      );
    } catch (error) {
      if (!isMissingRoom(error)) {
        throw wrapLiveKitError(error, "Não foi possível sair da sala de voz.");
      }
    }

    return this.list(conversationId);
  }

  private rooms(): RoomServiceClient {
    if (!this.client) {
      this.client = new RoomServiceClient(
        getLiveKitHttpUrl(),
        getLiveKitApiKey(),
        getLiveKitApiSecret(),
      );
    }

    return this.client;
  }
}

async function issueToken(
  conversationId: number,
  participant: VoiceParticipant,
): Promise<string> {
  const access = new AccessToken(getLiveKitApiKey(), getLiveKitApiSecret(), {
    identity: String(participant.userId),
    name: participant.name,
    metadata: JSON.stringify({
      imageUrl: participant.imageUrl,
      isDeafened: participant.isDeafened,
    }),
    ttl: VOICE_TOKEN_TTL,
  });
  access.addGrant({
    roomJoin: true,
    room: liveKitRoomName(conversationId),
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return access.toJwt();
}

function withJoiningParticipant(
  room: VoiceRoom,
  participant: VoiceParticipant,
): VoiceRoom {
  if (room.participants.some((item) => item.userId === participant.userId)) {
    return room;
  }

  return {
    ...room,
    participants: [...room.participants, participant],
  };
}

function mapParticipant(info: ParticipantInfo): VoiceParticipant | null {
  const userId = Number(info.identity);
  if (!Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  const metadata = readMetadata(info.metadata);
  return {
    userId,
    name: info.name.trim() || "Usuário",
    imageUrl: metadata.imageUrl,
    joinedAt: joinedAtMs(info),
    isMicMuted: !hasLiveSource(info.tracks, TrackSource.MICROPHONE),
    isDeafened: metadata.isDeafened,
    isCameraOn: hasLiveSource(info.tracks, TrackSource.CAMERA),
    isScreenSharing: hasLiveSource(info.tracks, TrackSource.SCREEN_SHARE),
  };
}

function hasLiveSource(tracks: TrackInfo[], source: TrackSource): boolean {
  return tracks.some((track) => track.source === source && !track.muted);
}

function joinedAtMs(info: ParticipantInfo): number {
  const joinedMs = Number(info.joinedAtMs);
  if (joinedMs > 0) {
    return joinedMs;
  }

  const joinedSeconds = Number(info.joinedAt);
  if (joinedSeconds > 0) {
    return joinedSeconds * 1000;
  }

  return Date.now();
}

function readMetadata(raw: string): { imageUrl: string; isDeafened: boolean } {
  try {
    const parsed = JSON.parse(raw || "{}") as {
      imageUrl?: string;
      isDeafened?: boolean;
    };
    return {
      imageUrl: parsed.imageUrl?.trim() ?? "",
      isDeafened: Boolean(parsed.isDeafened),
    };
  } catch {
    return { imageUrl: "", isDeafened: false };
  }
}

function isMissingRoom(error: unknown): boolean {
  if (error instanceof ServerError && (error.status === 404 || error.code === "not_found")) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /not found|does not exist|no room/i.test(message);
}

function wrapLiveKitError(error: unknown, fallback: string): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  console.error(fallback, error);
  return new ApplicationError(fallback, 502);
}
