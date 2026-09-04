import { ApplicationError } from "@/application/errors";
import type { GoogleWorkspaceRepository as GoogleWorkspacePort } from "@/application/ports/GoogleWorkspaceRepository";
import type { GoogleCalendarEvent } from "@/domain/GoogleCalendarEvent";
import type { GoogleTask } from "@/domain/GoogleTask";
import { getGoogleClientId, getGoogleClientSecret } from "../config";

const CALENDAR_URL = "https://www.googleapis.com/calendar/v3/calendars/primary";
const TASKS_LISTS_URL = "https://tasks.googleapis.com/tasks/v1/users/@me/lists";

/**
 * Calendar e Tasks da conta Google do usuário.
 * Renova o access token a cada chamada e fala com as APIs REST oficiais.
 */
export class GoogleWorkspaceRepository implements GoogleWorkspacePort {
  /**
   * Eventos no intervalo [timeMin, timeMax].
   */
  async listEvents(
    refreshToken: string,
    range: { timeMin: string; timeMax: string },
  ): Promise<GoogleCalendarEvent[]> {
    const access = await accessTokenOf(refreshToken);
    const search = new URLSearchParams({
      timeMin: range.timeMin,
      timeMax: range.timeMax,
      singleEvents: "true",
      orderBy: "startTime",
    });
    const data = await googleJson<{
      items?: GoogleEventDto[];
    }>(`${CALENDAR_URL}/events?${search}`, access);

    return (data.items ?? []).map(mapEvent);
  }

  /**
   * Cria um evento no calendário principal.
   */
  async createEvent(
    refreshToken: string,
    input: {
      title: string;
      start: string;
      end: string;
      description?: string;
    },
  ): Promise<GoogleCalendarEvent> {
    const access = await accessTokenOf(refreshToken);
    const created = await googleJson<GoogleEventDto>(`${CALENDAR_URL}/events`, access, {
      method: "POST",
      body: {
        summary: input.title,
        description: input.description ?? "",
        start: dateField(input.start),
        end: dateField(input.end),
      },
    });

    return mapEvent(created);
  }

  /**
   * Altera título, horário ou descrição de um evento.
   */
  async updateEvent(
    refreshToken: string,
    input: {
      eventId: string;
      title?: string;
      start?: string;
      end?: string;
      description?: string;
    },
  ): Promise<GoogleCalendarEvent> {
    const access = await accessTokenOf(refreshToken);
    const body: Record<string, unknown> = {};
    if (input.title) {
      body.summary = input.title;
    }
    if (input.description !== undefined) {
      body.description = input.description;
    }
    if (input.start) {
      body.start = dateField(input.start);
    }
    if (input.end) {
      body.end = dateField(input.end);
    }

    const updated = await googleJson<GoogleEventDto>(
      `${CALENDAR_URL}/events/${encodeURIComponent(input.eventId)}`,
      access,
      { method: "PATCH", body },
    );

    return mapEvent(updated);
  }

  /**
   * Tarefas da lista padrão (não concluídas).
   */
  async listTasks(refreshToken: string): Promise<GoogleTask[]> {
    const access = await accessTokenOf(refreshToken);
    const listId = await defaultTaskListId(access);
    const data = await googleJson<{ items?: GoogleTaskDto[] }>(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false`,
      access,
    );

    return (data.items ?? []).map(mapTask);
  }

  /**
   * Cria uma tarefa na lista padrão.
   */
  async createTask(
    refreshToken: string,
    input: { title: string; notes?: string; due?: string },
  ): Promise<GoogleTask> {
    const access = await accessTokenOf(refreshToken);
    const listId = await defaultTaskListId(access);
    const created = await googleJson<GoogleTaskDto>(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`,
      access,
      {
        method: "POST",
        body: {
          title: input.title,
          notes: input.notes ?? "",
          due: input.due,
        },
      },
    );

    return mapTask(created);
  }

  /**
   * Marca a tarefa como concluída.
   */
  async completeTask(refreshToken: string, taskId: string): Promise<GoogleTask> {
    const access = await accessTokenOf(refreshToken);
    const listId = await defaultTaskListId(access);
    const updated = await googleJson<GoogleTaskDto>(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${encodeURIComponent(taskId)}`,
      access,
      { method: "PATCH", body: { status: "completed" } },
    );

    return mapTask(updated);
  }
}

type GoogleEventDto = {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GoogleTaskDto = {
  id?: string;
  title?: string;
  notes?: string;
  due?: string;
  status?: string;
};

async function accessTokenOf(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new ApplicationError(
      data.error || "Não foi possível renovar o acesso ao Google.",
      502,
    );
  }

  return data.access_token;
}

async function defaultTaskListId(accessToken: string): Promise<string> {
  const data = await googleJson<{ items?: Array<{ id?: string }> }>(
    TASKS_LISTS_URL,
    accessToken,
  );
  const listId = data.items?.[0]?.id;
  if (!listId) {
    throw new ApplicationError("Nenhuma lista de tarefas no Google.", 502);
  }

  return listId;
}

async function googleJson<T>(
  url: string,
  accessToken: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(url, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new ApplicationError(
      data.error?.message || `Google retornou ${response.status}`,
      502,
    );
  }

  return data;
}

function mapEvent(dto: GoogleEventDto): GoogleCalendarEvent {
  return {
    id: dto.id ?? "",
    title: dto.summary?.trim() || "(sem título)",
    start: dto.start?.dateTime ?? dto.start?.date ?? "",
    end: dto.end?.dateTime ?? dto.end?.date ?? "",
    description: dto.description?.trim() ?? "",
  };
}

function mapTask(dto: GoogleTaskDto): GoogleTask {
  return {
    id: dto.id ?? "",
    title: dto.title?.trim() || "(sem título)",
    notes: dto.notes?.trim() ?? "",
    due: dto.due ?? null,
    isCompleted: dto.status === "completed",
  };
}

function dateField(value: string): { dateTime: string; timeZone: string } {
  return { dateTime: value, timeZone: "America/Sao_Paulo" };
}
