export const MAX_VOICE_PARTICIPANTS = 12;

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

export type VoiceSignalKind = "offer" | "answer" | "ice";

export type VoiceSignal = {
  id: string;
  conversationId: number;
  fromUserId: number;
  toUserId: number;
  kind: VoiceSignalKind;
  payload: Record<string, unknown>;
};

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
