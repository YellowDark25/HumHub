import type { VoiceSignalKind } from "@/domain/VoiceRoom";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { VoiceRoomRepository } from "../ports/VoiceRoomRepository";
import { getCurrentUser } from "./getCurrentUser";
import { requireVoiceChannel } from "./requireVoiceChannel";

const SIGNAL_KINDS: VoiceSignalKind[] = ["offer", "answer", "ice"];

export async function sendVoiceSignal(
  chat: ChatRepository,
  auth: AuthRepository,
  voice: VoiceRoomRepository,
  token: string,
  conversationId: number,
  toUserId: number,
  kind: string,
  payload: Record<string, unknown>,
) {
  await requireVoiceChannel(chat, token, conversationId);

  if (!toUserId) {
    throw new ApplicationError("Destinatário inválido.", 400);
  }

  if (!isSignalKind(kind)) {
    throw new ApplicationError("Sinal inválido.", 400);
  }

  const user = await getCurrentUser(auth, token);
  if (user.id === toUserId) {
    throw new ApplicationError("Não é possível sinalizar para si mesmo.", 400);
  }

  const room = voice.list(conversationId);
  const bothPresent =
    room.participants.some((item) => item.userId === user.id) &&
    room.participants.some((item) => item.userId === toUserId);

  if (!bothPresent) {
    throw new ApplicationError("Os participantes não estão na mesma sala.", 409);
  }

  return voice.enqueueSignal({
    conversationId,
    fromUserId: user.id,
    toUserId,
    kind,
    payload,
  });
}

function isSignalKind(value: string): value is VoiceSignalKind {
  return SIGNAL_KINDS.includes(value as VoiceSignalKind);
}
