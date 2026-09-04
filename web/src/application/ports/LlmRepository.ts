import type {
  LlmChatMessage,
  LlmCompletion,
  LlmToolDefinition,
} from "@/domain/LlmTurn";

/**
 * Porta do modelo de linguagem da secretária.
 * Recebe histórico, instrução e tools; devolve texto e/ou chamadas.
 */
export interface LlmRepository {
  isConfigured(): boolean;
  complete(input: {
    system: string;
    messages: LlmChatMessage[];
    tools: LlmToolDefinition[];
  }): Promise<LlmCompletion>;
}
