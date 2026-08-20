import { ApplicationError } from "@/application/errors";
import type {
  ChatRepository,
  ConversationLists,
} from "@/application/ports/ChatRepository";
import type { ChatMessage } from "@/domain/ChatMessage";
import { nexchatRequest } from "./client";
import { mapChatMessage, mapConversation } from "./mappers";
import type {
  NexchatBootstrap,
  NexchatPoll,
  NexchatSendResult,
} from "./types";

export class NexchatChatRepository implements ChatRepository {
  async listConversations(token: string): Promise<ConversationLists> {
    const data = await nexchatRequest<NexchatBootstrap>({
      path: "bootstrap",
      token,
    });

    return {
      channels: (data.channels ?? []).map((item) =>
        mapConversation(item, "channel"),
      ),
      dms: (data.dms ?? []).map((item) => mapConversation(item, "dm")),
      pendingInvites: (data.pendingInvites ?? []).map((item) =>
        mapConversation(item, "invite"),
      ),
    };
  }

  async listMessages(
    token: string,
    conversationId: number,
  ): Promise<ChatMessage[]> {
    const poll = await nexchatRequest<NexchatPoll>({
      path: "poll",
      token,
      query: { id: conversationId, since: 0 },
    });

    return (poll.messages ?? []).map(mapChatMessage);
  }

  async sendMessage(
    token: string,
    conversationId: number,
    content: string,
  ): Promise<ChatMessage> {
    const result = await nexchatRequest<NexchatSendResult>({
      path: "send",
      token,
      method: "POST",
      body: { conversation_id: conversationId, content },
    });

    if (!result.message) {
      throw new ApplicationError("Não foi possível enviar a mensagem.", 502);
    }

    return mapChatMessage(result.message);
  }
}
