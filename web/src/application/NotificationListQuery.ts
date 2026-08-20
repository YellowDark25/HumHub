export type NotificationListQuery = {
  limit?: number;
  excludedCategoryIds?: string[];
  includeUnseen?: boolean;
  includeSeen?: boolean;
};
