"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { VoiceParticipant, VoiceSignal } from "@/domain/VoiceRoom";
import {
  VOICE_SIGNAL_POLL_MS,
  pullVoiceSignalsApi,
  sendVoiceSignalApi,
} from "./voiceApi";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

type UseVoicePeersArgs = {
  conversationId: number;
  self: VoiceParticipant | null;
  others: VoiceParticipant[];
  localStream: MediaStream | null;
  mediaVersion: number;
  enabled: boolean;
};

export function useVoicePeers({
  conversationId,
  self,
  others,
  localStream,
  mediaVersion,
  enabled,
}: UseVoicePeersArgs) {
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>(
    {},
  );
  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const iceQueueRef = useRef<Map<number, RTCIceCandidateInit[]>>(new Map());
  const localRef = useRef(localStream);
  localRef.current = localStream;

  useEffect(() => {
    if (!enabled || !self || !localStream) {
      return;
    }

    const otherIds = new Set(others.map((item) => item.userId));
    for (const [userId, peer] of peersRef.current) {
      if (!otherIds.has(userId)) {
        closePeer(userId, peersRef.current, iceQueueRef.current, setRemoteStreams);
        peer.close();
      }
    }

    for (const other of others) {
      if (peersRef.current.has(other.userId)) {
        void syncTracks(peersRef.current.get(other.userId)!, localStream);
        continue;
      }

      const peer = createPeer(
        conversationId,
        other.userId,
        localStream,
        iceQueueRef.current,
        setRemoteStreams,
      );
      peersRef.current.set(other.userId, peer);

      if (shouldOffer(self, other)) {
        void makeOffer(conversationId, other.userId, peer);
      }
    }
  }, [conversationId, enabled, localStream, others, self]);

  useEffect(() => {
    if (!localStream) {
      return;
    }

    for (const [userId, peer] of peersRef.current) {
      void syncTracks(peer, localStream).then((addedTrack) => {
        if (addedTrack) {
          void makeOffer(conversationId, userId, peer);
        }
      });
    }
  }, [conversationId, localStream, mediaVersion]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function pull() {
      try {
        const signals = await pullVoiceSignalsApi(conversationId);
        if (cancelled) {
          return;
        }
        const stream = localRef.current;
        if (!stream) {
          return;
        }
        for (const signal of signals) {
          try {
            await applySignal(
              conversationId,
              signal,
              stream,
              peersRef.current,
              iceQueueRef.current,
              setRemoteStreams,
            );
          } catch {
            continue;
          }
        }
      } catch {
        return;
      }
    }

    void pull();
    const timer = window.setInterval(() => void pull(), VOICE_SIGNAL_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [conversationId, enabled]);

  useEffect(() => {
    const peers = peersRef.current;
    const ice = iceQueueRef.current;
    return () => {
      for (const [userId, peer] of peers) {
        peer.close();
        peers.delete(userId);
        ice.delete(userId);
      }
      setRemoteStreams({});
    };
  }, [conversationId]);

  return { remoteStreams };
}

function createPeer(
  conversationId: number,
  userId: number,
  localStream: MediaStream,
  iceQueue: Map<number, RTCIceCandidateInit[]>,
  setRemoteStreams: Dispatch<SetStateAction<Record<number, MediaStream>>>,
) {
  const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

  peer.onicecandidate = (event) => {
    if (!event.candidate) {
      return;
    }
    void sendVoiceSignalApi(
      conversationId,
      userId,
      "ice",
      event.candidate.toJSON() as Record<string, unknown>,
    );
  };

  peer.ontrack = (event) => {
    setRemoteStreams((current) => {
      const stream = current[userId] ?? new MediaStream();
      const incoming = event.streams[0]?.getTracks() ?? [event.track];
      incoming.forEach((track) => {
        if (!stream.getTracks().some((item) => item.id === track.id)) {
          stream.addTrack(track);
        }
      });
      return { ...current, [userId]: stream };
    });
  };

  iceQueue.set(userId, []);
  return peer;
}

async function applySignal(
  conversationId: number,
  signal: VoiceSignal,
  localStream: MediaStream,
  peers: Map<number, RTCPeerConnection>,
  iceQueue: Map<number, RTCIceCandidateInit[]>,
  setRemoteStreams: Dispatch<SetStateAction<Record<number, MediaStream>>>,
) {
  let peer = peers.get(signal.fromUserId);
  if (!peer) {
    peer = createPeer(
      conversationId,
      signal.fromUserId,
      localStream,
      iceQueue,
      setRemoteStreams,
    );
    peers.set(signal.fromUserId, peer);
  }

  if (signal.kind === "offer") {
    await peer.setRemoteDescription(asDescription(signal.payload));
    await flushIce(peer, iceQueue.get(signal.fromUserId) ?? []);
    iceQueue.set(signal.fromUserId, []);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await sendVoiceSignalApi(conversationId, signal.fromUserId, "answer", {
      type: answer.type,
      sdp: answer.sdp ?? "",
    });
    return;
  }

  if (signal.kind === "answer") {
    await peer.setRemoteDescription(asDescription(signal.payload));
    await flushIce(peer, iceQueue.get(signal.fromUserId) ?? []);
    iceQueue.set(signal.fromUserId, []);
    return;
  }

  const candidate = asCandidate(signal.payload);
  if (!peer.remoteDescription) {
    iceQueue.set(signal.fromUserId, [
      ...(iceQueue.get(signal.fromUserId) ?? []),
      candidate,
    ]);
    return;
  }

  await peer.addIceCandidate(candidate);
}

async function makeOffer(
  conversationId: number,
  userId: number,
  peer: RTCPeerConnection,
) {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  await sendVoiceSignalApi(conversationId, userId, "offer", {
    type: offer.type,
    sdp: offer.sdp ?? "",
  });
}

async function syncTracks(peer: RTCPeerConnection, stream: MediaStream) {
  let addedTrack = false;
  for (const kind of ["audio", "video"] as const) {
    const track = stream.getTracks().find((item) => item.kind === kind) ?? null;
    const sender = peer.getSenders().find((item) => item.track?.kind === kind);
    if (sender) {
      if (sender.track !== track) {
        await sender.replaceTrack(track);
      }
    } else if (track) {
      peer.addTrack(track, stream);
      addedTrack = true;
    }
  }
  return addedTrack;
}

function shouldOffer(self: VoiceParticipant, other: VoiceParticipant) {
  if (self.joinedAt !== other.joinedAt) {
    return self.joinedAt > other.joinedAt;
  }

  return self.userId > other.userId;
}

function closePeer(
  userId: number,
  peers: Map<number, RTCPeerConnection>,
  iceQueue: Map<number, RTCIceCandidateInit[]>,
  setRemoteStreams: Dispatch<SetStateAction<Record<number, MediaStream>>>,
) {
  peers.get(userId)?.close();
  peers.delete(userId);
  iceQueue.delete(userId);
  setRemoteStreams((current) => {
    const next = { ...current };
    delete next[userId];
    return next;
  });
}

function asDescription(payload: Record<string, unknown>): RTCSessionDescriptionInit {
  return {
    type: payload.type as RTCSdpType,
    sdp: String(payload.sdp ?? ""),
  };
}

function asCandidate(payload: Record<string, unknown>): RTCIceCandidateInit {
  return {
    candidate: payload.candidate == null ? undefined : String(payload.candidate),
    sdpMid: payload.sdpMid == null ? undefined : String(payload.sdpMid),
    sdpMLineIndex:
      payload.sdpMLineIndex == null ? undefined : Number(payload.sdpMLineIndex),
  };
}

async function flushIce(peer: RTCPeerConnection, queued: RTCIceCandidateInit[]) {
  for (const candidate of queued) {
    await peer.addIceCandidate(candidate);
  }
}
