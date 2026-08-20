export type NotificationPreferenceCategory = {
  id: string;
  title: string;
  description: string;
  web: boolean;
  email: boolean;
  webEditable: boolean;
  emailEditable: boolean;
};

export type NotificationPreferences = {
  spaceIds: number[];
  categories: NotificationPreferenceCategory[];
};

export type NotificationPreferencePatch = {
  spaceIds: number[];
  channels: Record<string, { web: boolean; email: boolean }>;
};
