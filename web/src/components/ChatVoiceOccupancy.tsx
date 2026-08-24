"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { VoiceParticipant, VoiceRoom } from "@/domain/VoiceRoom";
import { formatCallDuration } from "@/shared/format";
import { Avatar } from "./Avatar";
import { useVoiceCall } from "./useVoiceCall";

type OccupancyValue = {
  occupantsByChannel: Record<number, VoiceParticipant[]>;
  connectedRoom: VoiceRoom | null;
  selfJoinedAt: number | null;
};

const OccupancyContext = createContext<OccupancyValue>({
  occupantsByChannel: {},
  connectedRoom: null,
  selfJoinedAt: null,
});

const OCCUPANCY_POLL_MS = 4000;

export function ChatVoiceOccupancyProvider({
  currentUserId,
  children,
}: {
  currentUserId: number | null;
  children: ReactNode;
}) {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const call = useVoiceCall();
  const liveConversationId = call.channel?.conversationId ?? null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/chat/voice");
        if (!response.ok || cancelled) {
          return;
        }
        const payload = (await response.json()) as { rooms?: VoiceRoom[] };
        if (!cancelled) {
          setRooms(payload.rooms ?? []);
        }
      } catch {
        return;
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), OCCUPANCY_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [liveConversationId]);

  const value = useMemo<OccupancyValue>(() => {
    const occupantsByChannel = Object.fromEntries(
      rooms.map((room) => [room.conversationId, room.participants]),
    );
    const liveRoom = call.channel ? call.room : null;
    if (liveRoom) {
      occupantsByChannel[liveRoom.conversationId] = mergeOccupants(
        occupantsByChannel[liveRoom.conversationId] ?? [],
        liveRoom.participants,
      );
    } else if (currentUserId) {
      for (const conversationId of Object.keys(occupantsByChannel)) {
        occupantsByChannel[Number(conversationId)] = occupantsByChannel[
          Number(conversationId)
        ].filter((person) => person.userId !== currentUserId);
      }
    }
    const connectedRoom = liveRoom;
    const selfJoinedAt = joinedAtOf(connectedRoom, currentUserId);
    return { occupantsByChannel, connectedRoom, selfJoinedAt };
  }, [call.channel, call.room, currentUserId, rooms]);

  return (
    <OccupancyContext.Provider value={value}>{children}</OccupancyContext.Provider>
  );
}

export function useVoiceOccupancy() {
  return useContext(OccupancyContext);
}

export function useVoiceCallDuration(conversationId: number | null): string | null {
  const { connectedRoom, selfJoinedAt } = useVoiceOccupancy();
  const [now, setNow] = useState(() => Date.now());
  const startedAt =
    conversationId && connectedRoom?.conversationId === conversationId
      ? selfJoinedAt
      : null;

  useEffect(() => {
    if (!startedAt) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  if (!startedAt) {
    return null;
  }

  return formatCallDuration(Math.floor((now - startedAt) / 1000));
}

function mergeOccupants(
  polled: VoiceParticipant[],
  live: VoiceParticipant[],
): VoiceParticipant[] {
  const byId = new Map(polled.map((person) => [person.userId, person]));
  for (const person of live) {
    byId.set(person.userId, person);
  }
  return [...byId.values()];
}

function joinedAtOf(room: VoiceRoom | null, userId: number | null): number | null {
  if (!room || !userId) {
    return null;
  }

  const joinedAt = room.participants.find((item) => item.userId === userId)?.joinedAt;
  return joinedAt && joinedAt > 0 ? joinedAt : null;
}

export function ChatVoiceOccupants({ conversationId }: { conversationId: number }) {
  const { occupantsByChannel } = useVoiceOccupancy();
  const people = occupantsByChannel[conversationId] ?? [];

  if (people.length === 0) {
    return null;
  }

  return (
    <ul className="mt-0.5 flex flex-col">
      {people.map((person) => (
        <li key={person.userId}>
          <div className="flex items-center gap-2 rounded-md py-1.5 pr-1.5 pl-9 hover:bg-zinc-100">
            <Avatar
              name={person.name}
              imageUrl={person.imageUrl}
              size="xs"
              shape="circle"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-600">
              {person.name}
            </span>
            {person.isDeafened ? (
              <VoiceStateIcon label="Ensurdecido">
                <HeadphoneOffIcon />
              </VoiceStateIcon>
            ) : person.isMicMuted ? (
              <VoiceStateIcon label="Microfone desligado">
                <MicOffIcon />
              </VoiceStateIcon>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function VoiceStateIcon({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span title={label} aria-label={label} className="shrink-0 text-red-500">
      {children}
    </span>
  );
}

function MicOffIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16" />
    </svg>
  );
}

function HeadphoneOffIcon() {
  return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
      <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
      <path d="M4 13a8 8 0 0 1 16 0M4 4l16 16" />
    </svg>
  );
}
