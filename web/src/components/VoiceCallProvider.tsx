"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/domain/User";
import type {
  VoiceCallChannel,
  VoiceMediaState,
  VoiceParticipant,
  VoiceRoom,
} from "@/domain/VoiceRoom";
import { useChatAudioControls } from "./useChatAudioControls";
import { useLiveKitRoom } from "./useLiveKitRoom";
import { VoiceCallAudioSink } from "./VoiceCallAudioSink";
import { useVoiceJoinChime } from "./useVoiceJoinChime";
import { useVoiceSession } from "./useVoiceSession";

type VoiceCallValue = {
  channel: VoiceCallChannel | null;
  room: VoiceRoom | null;
  self: VoiceParticipant | null;
  others: VoiceParticipant[];
  stream: MediaStream | null;
  remoteStreams: Record<number, MediaStream>;
  speakingIds: number[];
  media: VoiceMediaState;
  isReady: boolean;
  isJoining: boolean;
  error: string;
  join: (channel: VoiceCallChannel) => Promise<void>;
  leave: () => Promise<void>;
  toggleMic: () => void;
  toggleDeafen: () => void;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
};

const VoiceCallContext = createContext<VoiceCallValue | null>(null);

type VoiceCallProviderProps = {
  currentUser: Pick<User, "id" | "name" | "imageUrl">;
  children: ReactNode;
};

export function VoiceCallProvider({
  currentUser,
  children,
}: VoiceCallProviderProps) {
  const audio = useChatAudioControls();
  const session = useVoiceSession();
  const [channel, setChannel] = useState<VoiceCallChannel | null>(null);
  const mediaRef = useRef({
    isMicMuted: audio.isMicMuted,
    isDeafened: audio.isDeafened,
  });
  mediaRef.current = {
    isMicMuted: audio.isMicMuted,
    isDeafened: audio.isDeafened,
  };

  const live = useLiveKitRoom(session.session, {
    userId: currentUser.id,
    imageUrl: currentUser.imageUrl,
  });
  const otherIds = live.others.map((item) => item.userId);
  useVoiceJoinChime(Boolean(live.room), otherIds);

  const join = useCallback(
    async (next: VoiceCallChannel) => {
      const media = mediaRef.current;
      const joined = await session.join(next.conversationId, {
        isMicMuted: media.isMicMuted,
        isDeafened: media.isDeafened,
        isCameraOn: false,
        isScreenSharing: false,
      });
      if (joined) {
        setChannel(next);
      }
    },
    [session.join],
  );

  const leave = useCallback(async () => {
    await session.leave();
    setChannel(null);
  }, [session.leave]);

  const value = useMemo<VoiceCallValue>(() => {
    const media = live.media;
    const self = live.self ?? {
      userId: currentUser.id,
      name: currentUser.name,
      imageUrl: currentUser.imageUrl,
      joinedAt: 0,
      ...media,
    };

    return {
      channel,
      room: live.room ?? session.session?.room ?? null,
      self,
      others: live.others,
      stream: live.localStream,
      remoteStreams: live.remoteStreams,
      speakingIds: live.speakingIds,
      media,
      isReady: live.isReady,
      isJoining: session.isJoining,
      error: session.error || live.error,
      join,
      leave,
      toggleMic: live.toggleMic,
      toggleDeafen: live.toggleDeafen,
      toggleCamera: live.toggleCamera,
      toggleScreenShare: live.toggleScreenShare,
    };
  }, [
    channel,
    currentUser.id,
    currentUser.imageUrl,
    currentUser.name,
    join,
    leave,
    live.error,
    live.isReady,
    live.localStream,
    live.media,
    live.others,
    live.remoteStreams,
    live.room,
    live.self,
    live.speakingIds,
    live.toggleCamera,
    live.toggleDeafen,
    live.toggleMic,
    live.toggleScreenShare,
    session.error,
    session.isJoining,
    session.session,
  ]);

  return (
    <VoiceCallContext.Provider value={value}>
      {children}
      <VoiceCallAudioSink
        streams={live.remoteStreams}
        isDeafened={live.media.isDeafened}
      />
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  const value = useContext(VoiceCallContext);
  if (!value) {
    throw new Error("useVoiceCall precisa do VoiceCallProvider.");
  }

  return value;
}
