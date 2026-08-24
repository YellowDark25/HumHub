import type { ChatLiveEvent } from "@/domain/ChatLive";
import type { ChatTyper } from "@/domain/ChatTyping";

export const CHAT_TYPING_PULSE_MS = 2_000;
export const CHAT_TYPING_IDLE_MS = 3_000;
export const CHAT_TYPING_EXPIRE_MS = 5_000;

export function applyTypingPresence(
  typers: ChatTyper[],
  event: ChatLiveEvent,
  currentUserId: number,
): ChatTyper[] {
  if (event.type === "newMessage") {
    return typers.filter((typer) => typer.userId !== event.message.authorId);
  }

  if (event.type !== "typing" || event.userId === currentUserId) {
    return typers;
  }

  if (!event.isTyping) {
    return typers.filter((typer) => typer.userId !== event.userId);
  }

  const next: ChatTyper = {
    userId: event.userId,
    userName: event.userName,
    updatedAt: Date.now(),
  };

  if (typers.some((typer) => typer.userId === event.userId)) {
    return typers.map((typer) => (typer.userId === event.userId ? next : typer));
  }

  return [...typers, next];
}

export function expireTypers(typers: ChatTyper[], now = Date.now()): ChatTyper[] {
  return typers.filter((typer) => now - typer.updatedAt < CHAT_TYPING_EXPIRE_MS);
}

export function typingLabel(typers: ChatTyper[]): string {
  if (typers.length === 0) {
    return "";
  }

  if (typers.length === 1) {
    return `${typers[0].userName} está digitando…`;
  }

  if (typers.length === 2) {
    return `${typers[0].userName} e ${typers[1].userName} estão digitando…`;
  }

  return `${typers[0].userName} e mais ${typers.length - 1} estão digitando…`;
}
