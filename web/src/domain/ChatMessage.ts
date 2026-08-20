export type ChatMessage = {
  id: number;
  authorName: string;
  content: string;
  publishedAt: string | null;
  isDeleted: boolean;
};
