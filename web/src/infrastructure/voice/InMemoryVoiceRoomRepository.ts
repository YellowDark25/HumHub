import { ApplicationError } from "@/application/errors";
import type { VoiceRoomRepository } from "@/application/ports/VoiceRoomRepository";
import type {
  VoiceMediaState,
  VoiceParticipant,
  VoiceRoom,
  VoiceSignal,
} from "@/domain/VoiceRoom";
import {
  MAX_VOICE_SIGNALS,
  VOICE_STALE_MS,
} from "./constants";

type StoredParticipant = VoiceParticipant & {
  lastHeartbeatAt: number;
};

type VoiceStore = {
  rooms: Map<number, StoredParticipant[]>;
  signals: VoiceSignal[];
};

const globalStore = globalThis as typeof globalThis & {
  __nexhubVoiceRooms?: VoiceStore;
};

function store(): VoiceStore {
  if (!globalStore.__nexhubVoiceRooms) {
    globalStore.__nexhubVoiceRooms = {
      rooms: new Map(),
      signals: [],
    };
  }

  return globalStore.__nexhubVoiceRooms;
}

export class InMemoryVoiceRoomRepository implements VoiceRoomRepository {
  join(conversationId: number, participant: VoiceParticipant): VoiceRoom {
    this.prune();
    const others = this.participants(conversationId).filter(
      (item) => item.userId !== participant.userId,
    );
    store().rooms.set(conversationId, [
      ...others,
      { ...participant, lastHeartbeatAt: Date.now() },
    ]);
    return this.toRoom(conversationId);
  }

  leave(conversationId: number, userId: number): VoiceRoom {
    this.prune();
    const remaining = this.participants(conversationId).filter(
      (item) => item.userId !== userId,
    );

    if (remaining.length === 0) {
      store().rooms.delete(conversationId);
    } else {
      store().rooms.set(conversationId, remaining);
    }

    store().signals = store().signals.filter(
      (signal) =>
        signal.conversationId !== conversationId ||
        (signal.fromUserId !== userId && signal.toUserId !== userId),
    );
    return this.toRoom(conversationId);
  }

  heartbeat(
    conversationId: number,
    userId: number,
    media: VoiceMediaState,
  ): VoiceRoom {
    this.prune();
    const current = this.participants(conversationId).find(
      (item) => item.userId === userId,
    );

    if (!current) {
      throw new ApplicationError("Você não está nesta sala.", 404);
    }

    store().rooms.set(
      conversationId,
      this.participants(conversationId).map((item) =>
        item.userId === userId
          ? { ...item, ...media, lastHeartbeatAt: Date.now() }
          : item,
      ),
    );
    return this.toRoom(conversationId);
  }

  list(conversationId: number): VoiceRoom {
    this.prune();
    return this.toRoom(conversationId);
  }

  listAll(): VoiceRoom[] {
    this.prune();
    return [...store().rooms.keys()].map((conversationId) =>
      this.toRoom(conversationId),
    );
  }

  enqueueSignal(signal: Omit<VoiceSignal, "id">): VoiceSignal {
    this.prune();
    const next: VoiceSignal = { ...signal, id: crypto.randomUUID() };
    const queued = [...store().signals, next];
    store().signals = queued.slice(-MAX_VOICE_SIGNALS);
    return next;
  }

  pullSignals(conversationId: number, userId: number): VoiceSignal[] {
    this.prune();
    const mine = store().signals.filter(
      (signal) =>
        signal.conversationId === conversationId && signal.toUserId === userId,
    );
    store().signals = store().signals.filter(
      (signal) => !mine.some((item) => item.id === signal.id),
    );
    return mine;
  }

  private participants(conversationId: number): StoredParticipant[] {
    return store().rooms.get(conversationId) ?? [];
  }

  private toRoom(conversationId: number): VoiceRoom {
    return {
      conversationId,
      participants: this.participants(conversationId).map(toParticipant),
    };
  }

  private prune() {
    const now = Date.now();
    const rooms = store().rooms;

    for (const [conversationId, participants] of rooms) {
      const alive = participants.filter(
        (item) => now - item.lastHeartbeatAt < VOICE_STALE_MS,
      );
      if (alive.length === 0) {
        rooms.delete(conversationId);
      } else {
        rooms.set(conversationId, alive);
      }
    }

    const present = new Set<string>();
    for (const [conversationId, participants] of rooms) {
      for (const participant of participants) {
        present.add(`${conversationId}:${participant.userId}`);
      }
    }

    store().signals = store().signals.filter((signal) => {
      const from = `${signal.conversationId}:${signal.fromUserId}`;
      const to = `${signal.conversationId}:${signal.toUserId}`;
      return present.has(from) && present.has(to);
    });
  }
}

function toParticipant(item: StoredParticipant): VoiceParticipant {
  return {
    userId: item.userId,
    name: item.name,
    imageUrl: item.imageUrl,
    joinedAt: item.joinedAt,
    isMicMuted: item.isMicMuted,
    isDeafened: item.isDeafened,
    isCameraOn: item.isCameraOn,
    isScreenSharing: item.isScreenSharing,
  };
}
