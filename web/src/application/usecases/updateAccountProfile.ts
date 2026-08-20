import type { AccountProfile } from "@/domain/Account";
import { ApplicationError } from "../errors";
import type { AuthRepository } from "../ports/AuthRepository";

export async function updateAccountProfile(
  auth: AuthRepository,
  token: string,
  profile: AccountProfile,
) {
  const trimmed = trimProfile(profile);
  if (!trimmed.firstName || !trimmed.lastName) {
    throw new ApplicationError("Informe o primeiro e o último nome.", 400);
  }

  const account = await auth.getAccount(token);
  return auth.updateUser(token, account.userId, { profile: trimmed });
}

function trimProfile(profile: AccountProfile): AccountProfile {
  return {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    title: profile.title.trim(),
    gender: profile.gender.trim(),
    street: profile.street.trim(),
    zip: profile.zip.trim(),
    city: profile.city.trim(),
    country: profile.country.trim(),
    state: profile.state.trim(),
    birthday: profile.birthday.trim(),
    about: profile.about.trim(),
    phonePrivate: profile.phonePrivate.trim(),
    phoneWork: profile.phoneWork.trim(),
    mobile: profile.mobile.trim(),
    fax: profile.fax.trim(),
    skype: profile.skype.trim(),
    xmpp: profile.xmpp.trim(),
    website: profile.website.trim(),
    facebook: profile.facebook.trim(),
    linkedin: profile.linkedin.trim(),
    xing: profile.xing.trim(),
    youtube: profile.youtube.trim(),
    vimeo: profile.vimeo.trim(),
    flickr: profile.flickr.trim(),
    myspace: profile.myspace.trim(),
    twitter: profile.twitter.trim(),
  };
}
