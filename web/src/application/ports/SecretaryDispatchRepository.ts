import type { ChatFile } from "@/domain/ChatFile";
import type { GoogleAccountCredential } from "@/domain/GoogleAccount";
import type { SecretaryHistoryMessage } from "@/domain/SecretaryTurn";

/**
 * Porta do cano HumHub da secretária (serviço, sem JWT do usuário).
 * Responde na DM, lê histórico/áudio e busca o vínculo Google.
 */
export interface SecretaryDispatchRepository {
  reply(conversationId: number, content: string): Promise<void>;
  listHistory(conversationId: number): Promise<SecretaryHistoryMessage[]>;
  getAudioFile(fileId: number): Promise<ChatFile>;
  getGoogleAccount(userId: number): Promise<GoogleAccountCredential | null>;
  setTyping(conversationId: number, isTyping: boolean): Promise<void>;
}
