import type { VoiceMediaState, VoiceRoom, VoiceSignal } from "@/domain/VoiceRoom";
import { readApiError } from "@/shared/readApiError";

export const VOICE_HEARTBEAT_MS = 4000;
export const VOICE_SIGNAL_POLL_MS = 1500;

export async function fetchVoiceRoom(conversationId: number): Promise<VoiceRoom> {
  const response = await fetch(`/api/chat/channels/${conversationId}/voice`);
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível carregar a sala de voz."));
  }
  return response.json() as Promise<VoiceRoom>;
}

export async function joinVoiceRoomApi(
  conversationId: number,
  media: VoiceMediaState,
): Promise<VoiceRoom> {
  const response = await fetch(`/api/chat/channels/${conversationId}/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(media),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível entrar na sala de voz."));
  }
  return response.json() as Promise<VoiceRoom>;
}

export async function heartbeatVoiceRoomApi(
  conversationId: number,
  media: VoiceMediaState,
): Promise<VoiceRoom> {
  const response = await fetch(`/api/chat/channels/${conversationId}/voice`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(media),
  });
  if (response.status === 404) {
    return joinVoiceRoomApi(conversationId, media);
  }
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível atualizar a sala de voz."));
  }
  return response.json() as Promise<VoiceRoom>;
}

export async function leaveVoiceRoomApi(conversationId: number): Promise<void> {
  const response = await fetch(`/api/chat/channels/${conversationId}/voice`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(await readApiError(response, "Não foi possível sair da sala de voz."));
  }
}

export async function pullVoiceSignalsApi(
  conversationId: number,
): Promise<VoiceSignal[]> {
  const response = await fetch(`/api/chat/channels/${conversationId}/voice/signal`);
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível receber os sinais de voz."));
  }
  const payload = (await response.json()) as { signals?: VoiceSignal[] };
  return payload.signals ?? [];
}

export async function sendVoiceSignalApi(
  conversationId: number,
  toUserId: number,
  kind: VoiceSignal["kind"],
  payload: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`/api/chat/channels/${conversationId}/voice/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toUserId, kind, payload }),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível conectar o áudio."));
  }
}
