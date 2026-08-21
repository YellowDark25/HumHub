import type { ChatChannelType } from "@/domain/Conversation";
import { normalizeChannelName } from "@/shared/chatChannel";
import { ApplicationError } from "../errors";
import type { ChatRepository } from "../ports/ChatRepository";

const CHANNEL_TYPES: ChatChannelType[] = ["text", "voice", "forum"];

export function createChannel(
  chat: ChatRepository,
  token: string,
  input: {
    name: string;
    channelType: ChatChannelType;
    spaceId: number | null;
    isPrivate: boolean;
  },
) {
  const name = normalizeChannelName(input.name);
  if (!name) {
    throw new ApplicationError("Informe o nome do canal.", 400);
  }

  if (!CHANNEL_TYPES.includes(input.channelType)) {
    throw new ApplicationError("Tipo de canal inválido.", 400);
  }

  if (input.spaceId !== null && input.spaceId <= 0) {
    throw new ApplicationError("Espaço inválido.", 400);
  }

  return chat.createChannel(token, {
    name,
    channelType: input.channelType,
    spaceId: input.spaceId,
    isPrivate: Boolean(input.isPrivate),
  });
}
