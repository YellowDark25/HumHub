import type { GoogleCalendarEvent } from "@/domain/GoogleCalendarEvent";
import type { GoogleTask } from "@/domain/GoogleTask";

/**
 * Porta do Google Calendar e Tasks do usuário.
 * Todas as operações usam o refresh token gravado no vínculo.
 */
export interface GoogleWorkspaceRepository {
  listEvents(
    refreshToken: string,
    range: { timeMin: string; timeMax: string },
  ): Promise<GoogleCalendarEvent[]>;
  createEvent(
    refreshToken: string,
    input: {
      title: string;
      start: string;
      end: string;
      description?: string;
    },
  ): Promise<GoogleCalendarEvent>;
  updateEvent(
    refreshToken: string,
    input: {
      eventId: string;
      title?: string;
      start?: string;
      end?: string;
      description?: string;
    },
  ): Promise<GoogleCalendarEvent>;
  listTasks(refreshToken: string): Promise<GoogleTask[]>;
  createTask(
    refreshToken: string,
    input: { title: string; notes?: string; due?: string },
  ): Promise<GoogleTask>;
  completeTask(refreshToken: string, taskId: string): Promise<GoogleTask>;
}
