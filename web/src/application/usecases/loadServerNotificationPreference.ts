import { defaultChatNotificationPreference } from "@/shared/chatNotification";
import { isUnauthorized } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";
import { getServerNotificationPreference } from "./getServerNotificationPreference";

export async function loadServerNotificationPreference(
  chat: ChatRepository,
  token: string,
  spaceId: number | null,
) {
  if (spaceId === null) {
    return null;
  }

  try {
    return await getServerNotificationPreference(chat, token, spaceId);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao carregar preferências de notificação do servidor ${spaceId}.`,
      error,
    );
    return defaultChatNotificationPreference(spaceId);
  }
}
