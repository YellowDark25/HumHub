export const MAX_VOICE_PARTICIPANTS = 12;
export const VOICE_CARD_TONE_COUNT = 8;

export function voiceCardTone(userId: number): number {
  return Math.abs(Math.trunc(userId)) % VOICE_CARD_TONE_COUNT;
}

export type VoiceMediaState = {
  isMicMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
};

export type VoiceParticipant = VoiceMediaState & {
  userId: number;
  name: string;
  imageUrl: string;
  joinedAt: number;
};

export type VoiceRoom = {
  conversationId: number;
  participants: VoiceParticipant[];
};

export type VoiceSession = {
  url: string;
  token: string;
  room: VoiceRoom;
};

export type VoiceCallChannel = {
  conversationId: number;
  channelName: string;
  workspaceId: string;
};

export const MAX_VOICE_LISTEN_VOLUME = 100;

export type VoiceListenState = {
  isMuted: boolean;
  isAudioOff: boolean;
  volume: number;
};

export const DEFAULT_VOICE_LISTEN: VoiceListenState = {
  isMuted: false,
  isAudioOff: false,
  volume: MAX_VOICE_LISTEN_VOLUME,
};

export function clampVoiceVolume(value: number) {
  if (!Number.isFinite(value)) {
    return MAX_VOICE_LISTEN_VOLUME;
  }

  return Math.min(MAX_VOICE_LISTEN_VOLUME, Math.max(0, Math.round(value)));
}

export function readVoiceListen(
  input: Partial<VoiceListenState> | null | undefined,
): VoiceListenState {
  return {
    isMuted: Boolean(input?.isMuted),
    isAudioOff: Boolean(input?.isAudioOff),
    volume: clampVoiceVolume(Number(input?.volume ?? MAX_VOICE_LISTEN_VOLUME)),
  };
}

export function readVoiceMedia(
  input: Partial<VoiceMediaState> | null | undefined,
): VoiceMediaState {
  return {
    isMicMuted: Boolean(input?.isMicMuted),
    isDeafened: Boolean(input?.isDeafened),
    isCameraOn: Boolean(input?.isCameraOn),
    isScreenSharing: Boolean(input?.isScreenSharing),
  };
}
