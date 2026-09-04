/** Mensagem de conversa enviada ao modelo. */
export type LlmChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Ferramenta que o modelo pode chamar. */
export type LlmToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

/** Pedido de ferramenta devolvido pelo modelo. */
export type LlmToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

/** Uma rodada do modelo: texto e/ou chamadas de ferramenta. */
export type LlmCompletion = {
  text: string;
  toolCalls: LlmToolCall[];
};
