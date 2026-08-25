import type { ChatMessage, ChatReaction } from "./ChatMessage";

export type ChatLiveSubscription = {
  hubUrl: string;
  topic: string;
  token: string;
};

export type ChatLiveEvent =
  | {
      type: "newMessage";
      conversationId: number;
      message: ChatMessage;
    }
  | {
      type: "editMessage";
      conversationId: number;
      message: ChatMessage;
    }
  | {
      type: "deleteMessage";
      conversationId: number;
      messageId: number;
      message: ChatMessage | null;
    }
  | {
      type: "reaction";
      conversationId: number;
      messageId: number;
      reactions: ChatReaction[];
    }
  | {
      type: "typing";
      conversationId: number;
      userId: number;
      userName: string;
      isTyping: boolean;
    };

export type ChatLiveStream = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
};
