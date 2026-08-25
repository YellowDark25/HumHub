export type HumhubUserShort = {
  id: number;
  guid: string;
  display_name: string;
  url?: string;
};

export type HumhubUser = HumhubUserShort & {
  account?: {
    username?: string;
    email?: string;
    tags?: string[];
    language?: string;
    time_zone?: string;
    visibility?: number;
    status?: number;
    last_login?: string | null;
  };
  profile?: HumhubProfile;
};

export type HumhubProfile = {
  image_url?: string;
  banner_url?: string;
  title?: string;
  about?: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  state?: string;
  birthday?: string;
  phone_private?: string;
  phone_work?: string;
  mobile?: string;
  fax?: string;
  im_skype?: string;
  im_xmpp?: string;
  url?: string;
  url_facebook?: string;
  url_linkedin?: string;
  url_xing?: string;
  url_youtube?: string;
  url_vimeo?: string;
  url_flickr?: string;
  url_myspace?: string;
  url_twitter?: string;
};

export type HumhubSpace = {
  id: number;
  guid: string;
  name: string;
  description: string | null;
  contentcontainer_id: number;
  visibility: number;
  status: number;
};

export type HumhubMemberSpaces = {
  spaces?: HumhubSpace[];
};

export type HumhubComment = {
  id: number;
  message: string;
  createdAt?: string;
  createdBy?: HumhubUserShort;
};

export type HumhubPost = {
  id: number;
  message: string;
  content: {
    id: number;
    comments?: { total?: number; latest?: HumhubComment[] };
    likes?: { total?: number };
    metadata: {
      created_at: string | null;
      created_by: HumhubUserShort | null;
      contentcontainer_id: number;
      url?: string;
    };
  };
};

export type HumhubNotification = {
  id: number;
  output?: string;
  createdAt?: string;
  originator?: HumhubUserShort | null;
};

export type HumhubNotificationLiveSubscription = {
  available?: boolean;
  hubUrl?: string;
  topic?: string;
  jwt?: string;
};

export type HumhubNotificationPreferences = {
  spaceIds?: number[];
  categories?: HumhubNotificationPreferenceCategory[];
};

export type HumhubNotificationPreferenceCategory = {
  id?: string;
  title?: string;
  description?: string;
  web?: boolean;
  email?: boolean;
  webEditable?: boolean;
  emailEditable?: boolean;
};

export type HumhubActivity = {
  id: number;
  createdAt?: string;
  originator?: HumhubUserShort | null;
  content?: { output?: string };
};

export type HumhubMembership = {
  role?: string;
  user?: HumhubUserShort;
};

export type HumhubSpaceInvitee = {
  id: number;
  name: string;
  username?: string;
  imageUrl?: string;
};

export type HumhubSpaceInvitees = {
  users?: HumhubSpaceInvitee[];
};

export type HumhubDirectoryUser = {
  id: number;
  name: string;
  username?: string;
  title?: string;
  about?: string;
  tags?: string[];
  groups?: { id: number; name: string }[];
  imageUrl?: string;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  isSelf?: boolean;
  friendship?: string;
};

export type HumhubDirectoryUsers = {
  users?: HumhubDirectoryUser[];
};

export type HumhubDirectoryPerson = {
  user?: HumhubDirectoryUser;
};

export type HumhubSpaceInviteResult = {
  ok?: boolean;
};

export type HumhubReceivedSpaceInvite = {
  spaceId: number;
  spaceName: string;
  spaceImageUrl?: string;
  invitedByName?: string;
};

export type HumhubReceivedSpaceInvites = {
  invites?: HumhubReceivedSpaceInvite[];
};

export type HumhubSelectOption = {
  value?: string;
  label?: string;
};

export type HumhubBlockedUser = {
  id?: number;
  name?: string;
};

export type HumhubAccountSettings = {
  tags?: string[];
  language?: string;
  timeZone?: string;
  visibility?: number;
  hideOnlineStatus?: boolean;
  hideTourPanel?: boolean;
  markdownEditorMode?: number;
  blockedUsers?: HumhubBlockedUser[];
  languages?: HumhubSelectOption[];
  timeZones?: HumhubSelectOption[];
  visibilityOptions?: HumhubSelectOption[];
  editorModes?: HumhubSelectOption[];
  showVisibility?: boolean;
  visibilityEditable?: boolean;
  showOnlineStatus?: boolean;
  showTourPanel?: boolean;
  showBlockedUsers?: boolean;
};

export type HumhubAccountProfileModule = {
  id?: string;
  name?: string;
  version?: string;
  description?: string;
  imageUrl?: string;
  isEnabled?: boolean;
  canEnable?: boolean;
  canDisable?: boolean;
  configUrl?: string | null;
};

export type HumhubAccountModules = {
  modules?: HumhubAccountProfileModule[];
};

export type HumhubPage<T> = {
  total?: number;
  page?: number;
  pages?: number;
  results: T[];
};

export type HumhubLoginResponse = {
  auth_token?: string;
  token?: string;
  expired_at?: string | number;
  expires?: number;
  message?: string;
};

export type HumhubGroup = {
  id?: number;
  name?: string;
  description?: string;
  show_at_directory?: boolean;
  show_at_registration?: boolean;
};

export type HumhubAdminGroup = {
  id?: number;
  name?: string;
  description?: string;
  type?: string;
  memberCount?: number;
  extraMemberCount?: number;
  isDefault?: boolean;
  isProtected?: boolean;
  isAdminGroup?: boolean;
  showAtDirectory?: boolean;
  showAtRegistration?: boolean;
  notifyUsers?: boolean;
  sortOrder?: number;
  canDelete?: boolean;
};

export type HumhubAdminGroups = {
  groups?: HumhubAdminGroup[];
};

export type HumhubAdminGroupMember = {
  id?: number;
  name?: string;
  email?: string;
  imageUrl?: string;
  isManager?: boolean;
};

export type HumhubAdminGroupMembers = {
  members?: HumhubAdminGroupMember[];
};

export type HumhubAdminGroupPermission = {
  id?: string;
  moduleId?: string;
  moduleName?: string;
  title?: string;
  description?: string;
  state?: string;
  defaultLabel?: string;
  canChange?: boolean;
};

export type HumhubAdminGroupPermissions = {
  permissions?: HumhubAdminGroupPermission[];
};

export type HumhubAdminModule = {
  id?: string;
  name?: string;
  version?: string;
  description?: string;
  isEnabled?: boolean;
  canEnable?: boolean;
  canDisable?: boolean;
};

export type HumhubAdminModules = {
  modules?: HumhubAdminModule[];
};

export type HumhubCustomPage = {
  id?: number;
  title?: string;
  type?: string;
  target?: string;
  isAdminOnly?: boolean;
};

export type HumhubCustomPages = {
  pages?: HumhubCustomPage[];
};

export type HumhubAdminInformation = {
  appName?: string;
  version?: string;
  phpVersion?: string;
  databaseDriver?: string;
  databaseName?: string;
  baseUrl?: string;
  isDebug?: boolean;
};

export type HumhubAdminSettings = {
  name?: string;
  baseUrl?: string;
  defaultLanguage?: string;
  timeZone?: string;
  maintenanceMode?: boolean;
  languages?: HumhubSelectOption[];
  timeZones?: HumhubSelectOption[];
};

export type HumhubAdminProfileFieldType = {
  id?: string;
  label?: string;
};

export type HumhubAdminProfileField = {
  id?: number;
  categoryId?: number;
  internalName?: string;
  title?: string;
  description?: string;
  kind?: string;
  kindLabel?: string;
  sortOrder?: number;
  isRequired?: boolean;
  isVisible?: boolean;
  isEditable?: boolean;
  isSearchable?: boolean;
  showAtRegistration?: boolean;
  isSystem?: boolean;
  isVirtual?: boolean;
  canDelete?: boolean;
};

export type HumhubAdminProfileCategory = {
  id?: number;
  title?: string;
  description?: string;
  sortOrder?: number;
  isSystem?: boolean;
  canDelete?: boolean;
  fields?: HumhubAdminProfileField[];
};

export type HumhubAdminProfileCatalog = {
  categories?: HumhubAdminProfileCategory[];
  fieldTypes?: HumhubAdminProfileFieldType[];
};
