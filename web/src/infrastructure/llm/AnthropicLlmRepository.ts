import { ApplicationError } from "@/application/errors";
import type { LlmRepository } from "@/application/ports/LlmRepository";
import type {
  LlmChatMessage,
  LlmCompletion,
  LlmToolCall,
  LlmToolDefinition,
} from "@/domain/LlmTurn";
import { getAnthropicApiKey } from "../config";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

type AnthropicContent =
  | { type: "text"; text?: string }
  | {
      type: "tool_use";
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
    };

type AnthropicResponse = {
  content?: AnthropicContent[];
  error?: { message?: string };
};

/**
 * Claude via Messages API, com tool use.
 * Sem chave, isConfigured é falso e o turno cai no eco.
 */
export class AnthropicLlmRepository implements LlmRepository {
  /**
   * Diz se ANTHROPIC_API_KEY está presente.
   */
  isConfigured(): boolean {
    return Boolean(getAnthropicApiKey());
  }

  /**
   * Uma rodada: texto e/ou tool_use.
   */
  async complete(input: {
    system: string;
    messages: LlmChatMessage[];
    tools: LlmToolDefinition[];
  }): Promise<LlmCompletion> {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAnthropicApiKey(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: input.system,
        messages: input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        tools: input.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters,
        })),
      }),
    });

    const data = (await response.json()) as AnthropicResponse;
    if (!response.ok) {
      throw new ApplicationError(
        data.error?.message || "O Claude não respondeu.",
        502,
      );
    }

    const text: string[] = [];
    const toolCalls: LlmToolCall[] = [];
    for (const block of data.content ?? []) {
      if (block.type === "text" && block.text) {
        text.push(block.text);
      }
      if (block.type === "tool_use" && block.name && block.id) {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input ?? {},
        });
      }
    }

    return { text: text.join("\n").trim(), toolCalls };
  }
}
