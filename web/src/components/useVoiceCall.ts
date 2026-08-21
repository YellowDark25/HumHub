"use client";

import { useMemo } from "react";
import type { User } from "@/domain/User";
import { useLocalVoiceMedia } from "./useLocalVoiceMedia";
import { useVoiceJoinChime } from "./useVoiceJoinChime";
import { useVoicePeers } from "./useVoicePeers";
import { useVoicePresence } from "./useVoicePresence";

export function useVoiceCall(conversationId: number, currentUser: User) {
  const local = useLocalVoiceMedia();
  const presence = useVoicePresence(
    conversationId,
    local.media,
    local.isReady,
  );
  const self =
    presence.room?.participants.find((item) => item.userId === currentUser.id) ??
    null;
  const others = useMemo(
    () =>
      presence.room?.participants.filter(
        (item) => item.userId !== currentUser.id,
      ) ?? [],
    [currentUser.id, presence.room],
  );
  const peers = useVoicePeers({
    conversationId,
    self,
    others,
    localStream: local.stream,
    mediaVersion: local.mediaVersion,
    enabled: Boolean(presence.room),
  });
  const otherIds = useMemo(
    () => others.map((item) => item.userId),
    [others],
  );
  useVoiceJoinChime(Boolean(presence.room), otherIds);

  return {
    stream: local.stream,
    media: local.media,
    isReady: local.isReady,
    room: presence.room,
    self,
    others,
    remoteStreams: peers.remoteStreams,
    error: local.error || (presence.room ? "" : presence.error),
    toggleMic: local.toggleMic,
    toggleDeafen: local.toggleDeafen,
    toggleCamera: local.toggleCamera,
    toggleScreenShare: local.toggleScreenShare,
  };
}
