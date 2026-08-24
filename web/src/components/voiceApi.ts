import type { VoiceMediaState, VoiceSession } from "@/domain/VoiceRoom";
import { readApiError } from "@/shared/readApiError";

export async function joinVoiceRoomApi(
  conversationId: number,
  media: VoiceMediaState,
): Promise<VoiceSession> {
  const response = await fetch(`/api/chat/channels/${conversationId}/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(media),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível entrar na sala de voz."));
  }
  return response.json() as Promise<VoiceSession>;
}

export async function leaveVoiceRoomApi(
  conversationId: number,
  options?: { keepalive?: boolean },
): Promise<void> {
  const response = await fetch(`/api/chat/channels/${conversationId}/voice`, {
    method: "DELETE",
    keepalive: options?.keepalive,
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(await readApiError(response, "Não foi possível sair da sala de voz."));
  }
}
