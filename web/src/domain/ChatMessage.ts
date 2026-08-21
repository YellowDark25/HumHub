import type { ChatAttachment } from "./ChatAttachment";

export type ChatMessage = {
  id: number;
  authorId: number;
  authorName: string;
  authorImageUrl: string;
  content: string;
  publishedAt: string | null;
  isDeleted: boolean;
  attachments: ChatAttachment[];
};
