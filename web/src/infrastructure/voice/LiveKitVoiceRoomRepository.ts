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
  isLiveKitConfigured,
} from "../config";
import {
  conversationIdFromLiveKitRoom,
  liveKitRoomName,
  VOICE_TOKEN_TTL,
} from "./constants";

/**
 * Salas de voz via LiveKit: emite JWT e consulta o Room Service.
 * Sem LIVEKIT_* configurado, listar devolve vazio e entrar falha com 503 —
 * a Vercel não alcança o Docker local e não deve responder 502.
 */
export class LiveKitVoiceRoomRepository implements VoiceRoomRepository {
  private client: RoomServiceClient | null = null;

  /**
   * Abre uma sessão de voz: gera o token JWT e devolve a sala atual.
   * Exige LiveKit configurado; se a sala ainda não existe no servidor, entra com a lista vazia.
   */
  async createSession(
    conversationId: number,
    participant: VoiceParticipant,
  ): Promise<VoiceSession> {
    requireLiveKit();
    const token = await issueToken(conversationId, participant);
    const room = await this.list(conversationId);
    return {
      url: getPublicLiveKitUrl(),
      token,
      room: withJoiningParticipant(room, participant),
    };
  }

  /**
   * Lista quem está na sala do canal. Sala inexistente ou LiveKit fora do ar vira lista vazia.
   */
  async list(conversationId: number): Promise<VoiceRoom> {
    if (!isLiveKitConfigured()) {
      return emptyRoom(conversationId);
    }

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
      if (isMissingRoom(error) || isLiveKitUnreachable(error)) {
        return emptyRoom(conversationId);
      }

      throw wrapLiveKitError(error, "Não foi possível carregar a sala de voz.");
    }
  }

  /**
   * Lista todas as salas ativas no LiveKit. Sem config ou sem rede, devolve [] para a ocupação não quebrar.
   */
  async listAll(): Promise<VoiceRoom[]> {
    if (!isLiveKitConfigured()) {
      return [];
    }

    try {
      const rooms = await this.rooms().listRooms();
      const ids = rooms
        .map((room) => conversationIdFromLiveKitRoom(room.name))
        .filter((id): id is number => id !== null);
      return Promise.all(ids.map((conversationId) => this.list(conversationId)));
    } catch (error) {
      if (isLiveKitUnreachable(error)) {
        return [];
      }

      throw wrapLiveKitError(
        error,
        "Não foi possível carregar quem está em voz.",
      );
    }
  }

  /**
   * Remove o participante da sala LiveKit. Sem config ou sala ausente, devolve a sala vazia.
   */
  async removeParticipant(
    conversationId: number,
    userId: number,
  ): Promise<VoiceRoom> {
    if (!isLiveKitConfigured()) {
      return emptyRoom(conversationId);
    }

    try {
      await this.rooms().removeParticipant(
        liveKitRoomName(conversationId),
        String(userId),
      );
    } catch (error) {
      if (!isMissingRoom(error) && !isLiveKitUnreachable(error)) {
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

function emptyRoom(conversationId: number): VoiceRoom {
  return { conversationId, participants: [] };
}

/**
 * Impede emitir token quando LIVEKIT_URL/KEY/SECRET não estão no ambiente.
 * Sem isso o Room Service estoura 502 na Vercel, que não alcança o Docker local.
 */
function requireLiveKit() {
  if (!isLiveKitConfigured()) {
    throw new ApplicationError(
      "O serviço de voz não está configurado neste ambiente.",
      503,
    );
  }
}

function isMissingRoom(error: unknown): boolean {
  if (error instanceof ServerError && (error.status === 404 || error.code === "not_found")) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /not found|does not exist|no room/i.test(message);
}

function isLiveKitUnreachable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /não está definida|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|fetch failed|socket hang up|getaddrinfo/i.test(
    message,
  );
}

function wrapLiveKitError(error: unknown, fallback: string): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  console.error(fallback, error);
  return new ApplicationError(fallback, 502);
}
