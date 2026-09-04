import {
  SECRETARY_NOT_CONNECTED,
  SECRETARY_SYSTEM_PROMPT,
  secretaryToolDefinitions,
} from "@/shared/secretaryTools";
import { ApplicationError } from "../errors";
import type { GoogleWorkspaceRepository } from "../ports/GoogleWorkspaceRepository";
import type { LlmRepository } from "../ports/LlmRepository";
import type { SecretaryDispatchRepository } from "../ports/SecretaryDispatchRepository";
import type { SpeechToTextRepository } from "../ports/SpeechToTextRepository";
import type { SecretaryTurnInput } from "@/domain/SecretaryTurn";
import type { LlmChatMessage, LlmToolCall } from "@/domain/LlmTurn";

const MAX_TOOL_ROUNDS = 6;

/**
 * Processa um recado da DM da secretária e responde na mesma conversa.
 * Transcreve áudio se houver, chama o modelo com tools do Google e envia o texto final.
 */
export async function handleSecretaryTurn(
  dispatch: SecretaryDispatchRepository,
  llm: LlmRepository,
  speech: SpeechToTextRepository,
  google: GoogleWorkspaceRepository,
  input: SecretaryTurnInput,
) {
  if (!input.conversationId || !input.userId) {
    throw new ApplicationError("Turno da secretária inválido.", 400);
  }

  try {
    await runSecretaryTurn(dispatch, llm, speech, google, input);
  } catch (error) {
    const reason =
      error instanceof ApplicationError
        ? error.message
        : "Tente de novo em instantes.";
    try {
      await dispatch.reply(
        input.conversationId,
        `Não consegui concluir agora. ${reason}`,
      );
    } catch (replyError) {
      console.error("Não foi possível avisar o usuário no chat:", replyError);
    }
    throw error;
  }
}

/**
 * Corpo do turno: texto, Google, modelo e resposta.
 */
async function runSecretaryTurn(
  dispatch: SecretaryDispatchRepository,
  llm: LlmRepository,
  speech: SpeechToTextRepository,
  google: GoogleWorkspaceRepository,
  input: SecretaryTurnInput,
) {
  const spoken = await resolveUserText(dispatch, speech, input);
  if (!spoken) {
    await dispatch.reply(
      input.conversationId,
      "Não entendi o recado. Pode repetir em texto ou gravar de novo?",
    );
    return;
  }

  const account = await dispatch.getGoogleAccount(input.userId);
  if (!account) {
    await dispatch.reply(input.conversationId, SECRETARY_NOT_CONNECTED);
    return;
  }

  if (!llm.isConfigured()) {
    await dispatch.reply(input.conversationId, `Recebi: ${spoken}`);
    return;
  }

  const history = await dispatch.listHistory(input.conversationId);
  const messages: LlmChatMessage[] = history
    .filter((item) => item.content.trim())
    .map((item) => ({
      role: item.isSecretary ? "assistant" : "user",
      content: item.content,
    }));

  if (!messages.some((item) => item.role === "user" && item.content === spoken)) {
    messages.push({ role: "user", content: spoken });
  }

  const tools = secretaryToolDefinitions();
  let reply = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await llm.complete({
      system: SECRETARY_SYSTEM_PROMPT,
      messages,
      tools,
    });

    if (completion.toolCalls.length === 0) {
      reply = completion.text.trim();
      break;
    }

    const toolLines: string[] = [];
    for (const call of completion.toolCalls) {
      toolLines.push(await runSecretaryTool(google, account.refreshToken, call));
    }

    messages.push({
      role: "assistant",
      content: completion.text || "(usei as ferramentas da agenda)",
    });
    messages.push({
      role: "user",
      content: `Resultado das ferramentas:\n${toolLines.join("\n")}`,
    });
    reply = completion.text.trim();
  }

  await dispatch.reply(
    input.conversationId,
    reply || "Pronto. Se quiser, peço outro ajuste na agenda ou nas tarefas.",
  );
}

/**
 * Monta o texto do usuário: conteúdo da mensagem ou transcrição do anexo.
 */
async function resolveUserText(
  dispatch: SecretaryDispatchRepository,
  speech: SpeechToTextRepository,
  input: SecretaryTurnInput,
): Promise<string> {
  const written = input.content.trim();
  if (written) {
    return written;
  }

  if (!input.audioFileId) {
    return "";
  }

  if (!speech.isConfigured()) {
    return "";
  }

  const file = await dispatch.getAudioFile(input.audioFileId);
  return (await speech.transcribe({
    body: file.body,
    mimeType: file.contentType,
    fileName: file.fileName,
  })).trim();
}

/**
 * Executa uma tool do Google e devolve um resumo em texto para o modelo.
 */
async function runSecretaryTool(
  google: GoogleWorkspaceRepository,
  refreshToken: string,
  call: LlmToolCall,
): Promise<string> {
  try {
    switch (call.name) {
      case "list_events": {
        const events = await google.listEvents(refreshToken, {
          timeMin: String(call.arguments.timeMin ?? ""),
          timeMax: String(call.arguments.timeMax ?? ""),
        });
        return JSON.stringify(events);
      }
      case "create_event": {
        const created = await google.createEvent(refreshToken, {
          title: String(call.arguments.title ?? ""),
          start: String(call.arguments.start ?? ""),
          end: String(call.arguments.end ?? ""),
          description: optionalString(call.arguments.description),
        });
        return JSON.stringify(created);
      }
      case "update_event": {
        const updated = await google.updateEvent(refreshToken, {
          eventId: String(call.arguments.eventId ?? ""),
          title: optionalString(call.arguments.title),
          start: optionalString(call.arguments.start),
          end: optionalString(call.arguments.end),
          description: optionalString(call.arguments.description),
        });
        return JSON.stringify(updated);
      }
      case "list_tasks": {
        return JSON.stringify(await google.listTasks(refreshToken));
      }
      case "create_task": {
        const created = await google.createTask(refreshToken, {
          title: String(call.arguments.title ?? ""),
          notes: optionalString(call.arguments.notes),
          due: optionalString(call.arguments.due),
        });
        return JSON.stringify(created);
      }
      case "complete_task": {
        return JSON.stringify(
          await google.completeTask(
            refreshToken,
            String(call.arguments.taskId ?? ""),
          ),
        );
      }
      default:
        return `Ferramenta desconhecida: ${call.name}`;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "falha na ferramenta";
    return `Erro em ${call.name}: ${message}`;
  }
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}
