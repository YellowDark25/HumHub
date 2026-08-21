export type AccountProfile = {
  firstName: string;
  lastName: string;
  title: string;
  gender: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  state: string;
  birthday: string;
  about: string;
  phonePrivate: string;
  phoneWork: string;
  mobile: string;
  fax: string;
  skype: string;
  xmpp: string;
  website: string;
  facebook: string;
  linkedin: string;
  xing: string;
  youtube: string;
  vimeo: string;
  flickr: string;
  myspace: string;
  twitter: string;
};

export type Account = {
  userId: number;
  username: string;
  email: string;
  tags: string[];
  language: string;
  timeZone: string;
  visibility: number;
  profile: AccountProfile;
};

export type AccountPatch = {
  username?: string;
  email?: string;
  tags?: string[];
  language?: string;
  timeZone?: string;
  visibility?: number;
};

export type AccountUpdate = {
  profile?: AccountProfile;
  account?: AccountPatch;
  password?: string;
  currentPassword?: string;
};

export function emptyAccountProfile(): AccountProfile {
  return {
    firstName: "",
    lastName: "",
    title: "",
    gender: "",
    street: "",
    zip: "",
    city: "",
    country: "",
    state: "",
    birthday: "",
    about: "",
    phonePrivate: "",
    phoneWork: "",
    mobile: "",
    fax: "",
    skype: "",
    xmpp: "",
    website: "",
    facebook: "",
    linkedin: "",
    xing: "",
    youtube: "",
    vimeo: "",
    flickr: "",
    myspace: "",
    twitter: "",
  };
}
