"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LogLevel,
  Room,
  RoomEvent,
  setLogLevel,
  type Participant,
} from "livekit-client";

setLogLevel(LogLevel.silent);
import type {
  VoiceMediaState,
  VoiceParticipant,
  VoiceRoom,
  VoiceSession,
} from "@/domain/VoiceRoom";
import {
  browserMediaBlockedMessage,
  canCaptureBrowserMedia,
} from "@/shared/browserMedia";
import { useChatAudioControls } from "./useChatAudioControls";
import { unlockVoiceChimes } from "./playVoiceChime";

type LiveKitIdentity = {
  userId: number;
  imageUrl: string;
};

const ROOM_EVENTS = [
  RoomEvent.ParticipantConnected,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.ParticipantMetadataChanged,
  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
  RoomEvent.TrackSubscribed,
  RoomEvent.TrackUnsubscribed,
  RoomEvent.LocalTrackPublished,
  RoomEvent.LocalTrackUnpublished,
  RoomEvent.ActiveSpeakersChanged,
] as const;

export function useLiveKitRoom(
  session: VoiceSession | null,
  identity: LiveKitIdentity,
) {
  const audio = useChatAudioControls();
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef(audio);
  const identityRef = useRef(identity);
  const [room, setRoom] = useState<VoiceRoom | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>(
    {},
  );
  const [speakingIds, setSpeakingIds] = useState<number[]>([]);
  const [isReady, setReady] = useState(false);
  const [error, setError] = useState("");
  audioRef.current = audio;
  identityRef.current = identity;

  useEffect(() => {
    if (!session) {
      setRoom(null);
      setLocalStream(null);
      setRemoteStreams({});
      setSpeakingIds([]);
      setReady(false);
      return;
    }

    const current = session;
    const live = new Room({
      adaptiveStream: false,
      dynacast: false,
      disconnectOnPageLeave: true,
      publishDefaults: {
        simulcast: false,
        videoCodec: "vp8",
      },
    });
    roomRef.current = live;
    let cancelled = false;

    function refresh() {
      if (cancelled) {
        return;
      }
      setRoom(snapshotRoom(current.room.conversationId, live));
      setLocalStream((previous) => collectStream(live.localParticipant, previous));
      setRemoteStreams((previous) => collectRemoteStreams(live, previous));
    }

    function refreshSpeakers() {
      if (!cancelled) {
        setSpeakingIds(live.activeSpeakers.map(userIdOf).filter(isUserId));
      }
    }

    for (const event of ROOM_EVENTS) {
      if (event === RoomEvent.ActiveSpeakersChanged) {
        live.on(event, refreshSpeakers);
      } else {
        live.on(event, refresh);
      }
    }

    live.on(RoomEvent.TrackSubscriptionFailed, () => {
      if (!cancelled) {
        setError("O vídeo não chegou. Confira se a porta 7882/UDP está liberada no firewall.");
      }
    });

    async function connect() {
      try {
        await live.connect(current.url, current.token, {
          autoSubscribe: true,
          peerConnectionTimeout: 20_000,
        });
        if (cancelled) {
          live.disconnect();
          return;
        }
        unlockVoiceChimes();
        try {
          await applyLocalMedia(live, audioRef.current, identityRef.current);
          setError("");
        } catch (error) {
          setError(mediaErrorMessage(error, "Não foi possível acessar o microfone."));
        }
        refresh();
        refreshSpeakers();
        setReady(true);
      } catch {
        if (!cancelled) {
          setError("Não foi possível conectar à sala de voz.");
        }
      }
    }

    void connect();
    return () => {
      cancelled = true;
      setReady(false);
      setRoom(null);
      setLocalStream(null);
      setRemoteStreams({});
      setSpeakingIds([]);
      roomRef.current = null;
      live.disconnect();
    };
  }, [session]);

  useEffect(() => {
    const live = roomRef.current;
    if (!live || !isReady) {
      return;
    }

    void applyLocalMedia(live, audioRef.current, identityRef.current).catch(
      (error) => {
        setError(mediaErrorMessage(error, "Não foi possível acessar o microfone."));
      },
    );
  }, [
    audio.isDeafened,
    audio.inputDeviceId,
    audio.isMicMuted,
    identity.imageUrl,
    identity.userId,
    isReady,
  ]);

  const toggleCamera = useCallback(async () => {
    const live = roomRef.current;
    if (!live) {
      return;
    }

    setError("");
    if (!canCaptureBrowserMedia()) {
      setError(browserMediaBlockedMessage());
      return;
    }

    try {
      if (live.localParticipant.isScreenShareEnabled) {
        await live.localParticipant.setScreenShareEnabled(false);
      }
      await live.localParticipant.setCameraEnabled(
        !live.localParticipant.isCameraEnabled,
      );
    } catch {
      setError("Não foi possível ligar a câmera.");
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const live = roomRef.current;
    if (!live) {
      return;
    }

    setError("");
    if (!canCaptureBrowserMedia()) {
      setError(browserMediaBlockedMessage());
      return;
    }

    try {
      if (live.localParticipant.isCameraEnabled) {
        await live.localParticipant.setCameraEnabled(false);
      }
      await live.localParticipant.setScreenShareEnabled(
        !live.localParticipant.isScreenShareEnabled,
      );
    } catch {
      setError("Não foi possível compartilhar a tela.");
    }
  }, []);

  const self =
    room?.participants.find((item) => item.userId === identity.userId) ?? null;
  const others = useMemo(
    () =>
      room?.participants.filter((item) => item.userId !== identity.userId) ?? [],
    [identity.userId, room],
  );
  const media = useMemo<VoiceMediaState>(
    () => ({
      isMicMuted: audio.isMicMuted,
      isDeafened: audio.isDeafened,
      isCameraOn: self?.isCameraOn ?? false,
      isScreenSharing: self?.isScreenSharing ?? false,
    }),
    [
      audio.isDeafened,
      audio.isMicMuted,
      self?.isCameraOn,
      self?.isScreenSharing,
    ],
  );

  return {
    room,
    self,
    others,
    localStream,
    remoteStreams,
    speakingIds,
    media,
    isReady,
    error,
    toggleMic: audio.toggleMic,
    toggleDeafen: audio.toggleDeafen,
    toggleCamera,
    toggleScreenShare,
  };
}

async function applyLocalMedia(
  live: Room,
  audio: { isMicMuted: boolean; isDeafened: boolean; inputDeviceId: string },
  identity: LiveKitIdentity,
) {
  const micOn = !audio.isMicMuted && !audio.isDeafened;
  if (micOn && !canCaptureBrowserMedia()) {
    throw new Error(browserMediaBlockedMessage());
  }

  if (canCaptureBrowserMedia()) {
    await live.localParticipant.setMicrophoneEnabled(
      micOn,
      audio.inputDeviceId ? { deviceId: audio.inputDeviceId } : undefined,
    );
  }

  await live.localParticipant.setMetadata(
    JSON.stringify({
      imageUrl: identity.imageUrl,
      isDeafened: audio.isDeafened,
    }),
  );
}

function snapshotRoom(conversationId: number, live: Room): VoiceRoom {
  const people = [live.localParticipant, ...live.remoteParticipants.values()]
    .map(toVoiceParticipant)
    .filter((item): item is VoiceParticipant => item !== null);
  return { conversationId, participants: people };
}

function collectRemoteStreams(
  live: Room,
  previous: Record<number, MediaStream>,
): Record<number, MediaStream> {
  const remotes: Record<number, MediaStream> = {};
  for (const participant of live.remoteParticipants.values()) {
    const userId = userIdOf(participant);
    if (!isUserId(userId)) {
      continue;
    }
    const stream = collectStream(participant, previous[userId] ?? null);
    if (stream) {
      remotes[userId] = stream;
    }
  }

  if (sameStreamMap(previous, remotes)) {
    return previous;
  }

  return remotes;
}

function collectStream(
  participant: Participant,
  previous: MediaStream | null,
): MediaStream | null {
  const tracks: MediaStreamTrack[] = [];
  for (const publication of participant.trackPublications.values()) {
    const track = publication.track?.mediaStreamTrack;
    if (track && track.readyState === "live") {
      tracks.push(track);
    }
  }

  if (tracks.length === 0) {
    return null;
  }

  if (previous && sameTracks(previous, tracks)) {
    return previous;
  }

  const stream = new MediaStream();
  for (const track of tracks) {
    stream.addTrack(track);
  }
  return stream;
}

function sameStreamMap(
  previous: Record<number, MediaStream>,
  next: Record<number, MediaStream>,
) {
  const previousIds = Object.keys(previous);
  const nextIds = Object.keys(next);
  if (previousIds.length !== nextIds.length) {
    return false;
  }

  return nextIds.every((id) => previous[Number(id)] === next[Number(id)]);
}

function sameTracks(stream: MediaStream, tracks: MediaStreamTrack[]) {
  const current = stream.getTracks();
  if (current.length !== tracks.length) {
    return false;
  }

  const ids = new Set(tracks.map((track) => track.id));
  return current.every((track) => ids.has(track.id));
}

function toVoiceParticipant(participant: Participant): VoiceParticipant | null {
  const userId = userIdOf(participant);
  if (!isUserId(userId)) {
    return null;
  }

  const metadata = readMetadata(participant.metadata);
  return {
    userId,
    name: participant.name?.trim() || "Usuário",
    imageUrl: metadata.imageUrl,
    joinedAt: participant.joinedAt?.getTime() ?? Date.now(),
    isMicMuted: !participant.isMicrophoneEnabled,
    isDeafened: metadata.isDeafened,
    isCameraOn: participant.isCameraEnabled,
    isScreenSharing: participant.isScreenShareEnabled,
  };
}

function readMetadata(raw: string | undefined): {
  imageUrl: string;
  isDeafened: boolean;
} {
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

function mediaErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && !canCaptureBrowserMedia()) {
    return error.message;
  }

  return fallback;
}

function userIdOf(participant: Participant): number {
  return Number(participant.identity);
}

function isUserId(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
