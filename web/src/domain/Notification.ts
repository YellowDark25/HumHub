export type Notification = {
  id: number;
  text: string;
  originatorName: string | null;
  publishedAt: string | null;
  isUnseen: boolean;
};
