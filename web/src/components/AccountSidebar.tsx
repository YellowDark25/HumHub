import {
  ACCOUNT_SECTIONS,
  accountSectionHref,
  type AccountSectionId,
} from "@/shared/accountSection";
import Link from "next/link";
import type { ReactNode } from "react";

type AccountSidebarProps = {
  section: AccountSectionId;
};

const SECTION_ICONS: Record<AccountSectionId, () => ReactNode> = {
  perfil: ProfileIcon,
  emails: MailIcon,
  notificacoes: BellIcon,
  geral: WrenchIcon,
  modulos: ModulesIcon,
  integracoes: LinkIcon,
};

export function AccountSidebar({ section }: AccountSidebarProps) {
  return (
    <nav className="rounded-2xl border border-zinc-200 bg-white p-3">
      <p className="px-2 pb-2 text-sm font-semibold text-zinc-900">Sua conta</p>
      <ul className="flex flex-col gap-1">
        {ACCOUNT_SECTIONS.map((item) => {
          const active = item.id === section;
          const Icon = SECTION_ICONS[item.id];
          return (
            <li key={item.id}>
              <Link
                href={accountSectionHref(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Icon />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function iconClass() {
  return "h-4 w-4 shrink-0 text-zinc-500";
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4L16 11l-3-3 1.7-1.7Z" />
    </svg>
  );
}

function ModulesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12 4 7.5" />
      <path d="M12 12v9" />
      <path d="m12 12 8-4.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 7.07 7.07L14 18.07" />
    </svg>
  );
}
