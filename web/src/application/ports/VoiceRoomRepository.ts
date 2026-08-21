import type {
  VoiceMediaState,
  VoiceParticipant,
  VoiceRoom,
  VoiceSignal,
} from "@/domain/VoiceRoom";

export interface VoiceRoomRepository {
  join(conversationId: number, participant: VoiceParticipant): VoiceRoom;
  leave(conversationId: number, userId: number): VoiceRoom;
  heartbeat(
    conversationId: number,
    userId: number,
    media: VoiceMediaState,
  ): VoiceRoom;
  list(conversationId: number): VoiceRoom;
  listAll(): VoiceRoom[];
  enqueueSignal(signal: Omit<VoiceSignal, "id">): VoiceSignal;
  pullSignals(conversationId: number, userId: number): VoiceSignal[];
}
