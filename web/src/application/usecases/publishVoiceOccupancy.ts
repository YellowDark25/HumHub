import type { VoiceOccupancyRoom } from "@/domain/VoiceRoom";
import { errorMessage } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

export async function publishVoiceOccupancy(
  chat: ChatRepository,
  token: string,
  room: VoiceOccupancyRoom,
) {
  try {
    await chat.publishVoiceOccupancy(token, room);
  } catch (error) {
    console.error(
      `Falha ao avisar ocupação de voz: ${errorMessage(error, "erro desconhecido")}`,
    );
  }
}
