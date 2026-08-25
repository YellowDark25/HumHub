const FORWARD_PREFIX = "nexhub-forward:v1:";

export type ChatForwarded = {
  authorName: string;
  content: string;
  comment: string;
};

export type ChatForwardTarget = {
  conversationId: number | null;
  userId: number | null;
  name: string;
  kind: "channel" | "dm";
  imageUrl: string;
  subtitle: string;
};

export function writeChatForwarded(input: ChatForwarded): string {
  const marker = `${FORWARD_PREFIX}${JSON.stringify({
    authorName: input.authorName,
    content: input.content,
  })}`;

  return input.comment.trim()
    ? `${input.comment.trim()}\n\n${marker}`
    : marker;
}

export function readChatForwarded(content: string): ChatForwarded | null {
  const separator = content.lastIndexOf(`\n\n${FORWARD_PREFIX}`);
  const markerAt = content.startsWith(FORWARD_PREFIX)
    ? 0
    : separator === -1
      ? -1
      : separator + 2;

  if (markerAt === -1) {
    return null;
  }

  const marker = content.slice(markerAt);
  const payload = parseForwardPayload(marker.slice(FORWARD_PREFIX.length));
  if (!payload) {
    return null;
  }

  return {
    authorName: payload.authorName,
    content: payload.content,
    comment: markerAt === 0 ? "" : content.slice(0, markerAt).trim(),
  };
}

export function forwardedSourceContent(content: string): string {
  return readChatForwarded(content)?.content ?? content;
}

function parseForwardPayload(raw: string): { authorName: string; content: string } | null {
  try {
    const parsed = JSON.parse(raw) as { authorName?: unknown; content?: unknown };
    if (typeof parsed.authorName !== "string" || typeof parsed.content !== "string") {
      return null;
    }

    return {
      authorName: parsed.authorName.trim() || "Usuário",
      content: parsed.content,
    };
  } catch {
    return null;
  }
}
