import type { LlmToolDefinition } from "@/domain/LlmTurn";

export const GOOGLE_CONNECT_HREF = "/configuracoes?secao=integracoes";

export const SECRETARY_SYSTEM_PROMPT = `Você é a Secretária da intranet NexHub.
Fala em português do Brasil, de forma curta e objetiva.
Controla a agenda e as tarefas do usuário no Google Calendar e no Google Tasks.
Quando faltar horário, duração ou título, pergunte antes de criar.
Confirme o que fez depois de cada alteração.
Não invente eventos ou tarefas que as tools não devolveram.
Fuso horário padrão: America/Sao_Paulo.`;

export const SECRETARY_NOT_CONNECTED =
  `Ainda não conectei sua conta Google. Abra ${GOOGLE_CONNECT_HREF} em Configurações → Integrações e autorize o Calendar e as Tarefas. Depois me chame de novo.`;

/**
 * Tools que o modelo pode chamar neste corte (Calendar + Tasks).
 */
export function secretaryToolDefinitions(): LlmToolDefinition[] {
  return [
    {
      name: "list_events",
      description: "Lista eventos da agenda no intervalo pedido.",
      parameters: {
        type: "object",
        properties: {
          timeMin: {
            type: "string",
            description: "Início do intervalo em ISO 8601.",
          },
          timeMax: {
            type: "string",
            description: "Fim do intervalo em ISO 8601.",
          },
        },
        required: ["timeMin", "timeMax"],
      },
    },
    {
      name: "create_event",
      description: "Cria um evento na agenda.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          start: { type: "string", description: "Início em ISO 8601." },
          end: { type: "string", description: "Fim em ISO 8601." },
          description: { type: "string" },
        },
        required: ["title", "start", "end"],
      },
    },
    {
      name: "update_event",
      description: "Altera um evento já existente.",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string" },
          title: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          description: { type: "string" },
        },
        required: ["eventId"],
      },
    },
    {
      name: "list_tasks",
      description: "Lista as tarefas abertas do Google Tasks.",
      parameters: { type: "object", properties: {} },
    },
    {
      name: "create_task",
      description: "Cria uma tarefa.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string" },
          due: { type: "string", description: "Prazo em ISO 8601." },
        },
        required: ["title"],
      },
    },
    {
      name: "complete_task",
      description: "Marca uma tarefa como concluída.",
      parameters: {
        type: "object",
        properties: { taskId: { type: "string" } },
        required: ["taskId"],
      },
    },
  ];
}
