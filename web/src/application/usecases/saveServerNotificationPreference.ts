import type { ChatNotificationPreferencePatch } from "@/domain/ChatNotificationPreference";
import {
  isChatMuteDuration,
  isChatNotificationLevel,
} from "@/shared/chatNotification";
import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export function saveServerNotificationPreference(
  chat: ChatRepository,
  token: string,
  patch: ChatNotificationPreferencePatch,
) {
  if (!Number.isFinite(patch.spaceId) || patch.spaceId < 0) {
    throw new ApplicationError("Servidor inválido.", 400);
  }

  if (patch.level !== undefined && !isChatNotificationLevel(patch.level)) {
    throw new ApplicationError("Nível de notificação inválido.", 400);
  }

  if (
    patch.muteDuration !== undefined &&
    patch.muteDuration !== null &&
    !isChatMuteDuration(patch.muteDuration)
  ) {
    throw new ApplicationError("Duração do silêncio inválida.", 400);
  }

  return chat.saveServerNotificationPreference(token, {
    spaceId: Math.trunc(patch.spaceId),
    level: patch.level,
    muteDuration: patch.muteDuration,
  });
}
