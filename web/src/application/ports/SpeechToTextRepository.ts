/**
 * Porta de transcrição de recados de áudio.
 * Recebe o arquivo da DM e devolve o texto falado.
 */
export interface SpeechToTextRepository {
  isConfigured(): boolean;
  transcribe(input: {
    body: ArrayBuffer;
    mimeType: string;
    fileName: string;
  }): Promise<string>;
}
