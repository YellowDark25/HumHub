import type { AuthRepository } from "../ports/AuthRepository";
import type { ChatRepository } from "../ports/ChatRepository";
import type { SpaceRepository } from "../ports/SpaceRepository";
import { createSpace } from "./createSpace";

export function createChatServer(
  auth: AuthRepository,
  spaces: SpaceRepository,
  chat: ChatRepository,
  token: string,
  name: string,
) {
  return createSpace(auth, spaces, chat, token, {
    name,
    description: "",
    visibility: "public",
    createServer: true,
  });
}
