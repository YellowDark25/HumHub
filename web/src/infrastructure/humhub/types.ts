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
  };
  profile?: {
    image_url?: string;
  };
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
