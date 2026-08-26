export const CHAT_FILE_ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.mp4,.webm,.mp3,.ogg,.wav";

export const CHAT_QUICK_REACTIONS = ["👍", "👀", "😆"] as const;
export const CHAT_MORE_REACTIONS = ["👍", "👀", "😆", "💯"] as const;

export const CHAT_EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😆",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤔",
  "🙄",
  "😢",
  "😭",
  "😡",
  "👍",
  "👎",
  "👏",
  "🙏",
  "🔥",
  "💯",
  "🎉",
  "❤️",
  "💔",
  "⭐",
  "🚀",
  "😮",
  "😴",
  "🤝",
  "👀",
];

export type ComposerPanel =
  | "plus"
  | "emoji"
  | "thread"
  | "poll"
  | "";

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || /\.(webm|ogg|mp3|wav|m4a)$/i.test(file.name);
}

/**
 * Selo de extensão do arquivo para miniatura sem preview.
 * Sem nome devolve ARQ; lê o sufixo depois do último ponto.
 */
export function fileExtensionLabel(name: string): string {
  const match = (name ?? "").match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toUpperCase() ?? "ARQ";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
