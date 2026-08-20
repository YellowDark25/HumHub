export type AccountSelectOption = {
  value: string;
  label: string;
};

export type BlockedAccountUser = {
  id: number;
  name: string;
};

export type AccountGeneralSettings = {
  tags: string[];
  language: string;
  timeZone: string;
  visibility: number;
  hideOnlineStatus: boolean;
  hideTourPanel: boolean;
  markdownEditorMode: "rich" | "plain";
  blockedUsers: BlockedAccountUser[];
  languages: AccountSelectOption[];
  timeZones: AccountSelectOption[];
  visibilityOptions: AccountSelectOption[];
  editorModes: AccountSelectOption[];
  showVisibility: boolean;
  visibilityEditable: boolean;
  showOnlineStatus: boolean;
  showTourPanel: boolean;
  showBlockedUsers: boolean;
};

export type AccountGeneralPatch = {
  tags: string[];
  language: string;
  timeZone: string;
  visibility: number;
  hideOnlineStatus: boolean;
  hideTourPanel: boolean;
  markdownEditorMode: "rich" | "plain";
  blockedUserIds: number[];
};
