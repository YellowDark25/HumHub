import {
  PROFILE_SECTIONS,
  profileSectionHref,
  type ProfileSectionId,
} from "@/shared/profileSection";
import Link from "next/link";

type ProfileMenuProps = {
  section: ProfileSectionId;
  inviteCount?: number;
};

export function ProfileMenu({ section, inviteCount = 0 }: ProfileMenuProps) {
  return (
    <nav className="rounded-2xl border border-zinc-200 bg-white p-3">
      <p className="px-2 pb-2 text-sm font-semibold text-zinc-900">
        Menu do perfil
      </p>
      <ul className="flex flex-col gap-1">
        {PROFILE_SECTIONS.map((item) => {
          const active = item.id === section;
          return (
            <li key={item.id}>
              <Link
                href={profileSectionHref(item.id)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {item.label}
                {item.id === "convites" && inviteCount > 0 ? (
                  <span className="rounded-full bg-teal-700 px-1.5 text-[10px] font-semibold text-white">
                    {inviteCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
