export type Notification = {
  id: number;
  text: string;
  originatorName: string | null;
  originatorImageUrl: string;
  publishedAt: string | null;
  isUnseen: boolean;
  href: string;
};
