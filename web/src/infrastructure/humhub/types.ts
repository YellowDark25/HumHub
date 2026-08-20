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

export type HumhubPage<T> = {
  total?: number;
  page?: number;
  pages?: number;
  results: T[];
};

export type HumhubLoginResponse = {
  auth_token?: string;
  expired_at?: string | number;
  message?: string;
};
