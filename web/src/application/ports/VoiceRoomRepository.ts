import type {
  VoiceParticipant,
  VoiceRoom,
  VoiceSession,
} from "@/domain/VoiceRoom";

export interface VoiceRoomRepository {
  createSession(
    conversationId: number,
    participant: VoiceParticipant,
  ): Promise<VoiceSession>;
  list(conversationId: number): Promise<VoiceRoom>;
  listAll(): Promise<VoiceRoom[]>;
  removeParticipant(
    conversationId: number,
    userId: number,
  ): Promise<VoiceRoom>;
}
