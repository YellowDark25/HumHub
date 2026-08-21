"use client";

import { ADMIN_SECTIONS, type AdminSectionId } from "@/shared/adminSection";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const SECTION_ICONS: Record<AdminSectionId, () => ReactNode> = {
  usuarios: UsersIcon,
  paginas: PagesIcon,
  espacos: SpacesIcon,
  modulos: ModulesIcon,
  configuracoes: SettingsIcon,
  informacao: InfoIcon,
};

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="rounded-2xl border border-zinc-200 bg-white p-3">
      <p className="px-2 pb-2 text-sm font-semibold text-zinc-900">
        Menu de administração
      </p>
      <ul className="flex flex-col gap-1">
        {ADMIN_SECTIONS.map((item) => {
          const active = isSectionActive(pathname, item.href);
          const Icon = SECTION_ICONS[item.id];
          return (
            <li key={item.id}>
              <Link
                href={item.href}
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

function isSectionActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function iconClass() {
  return "h-4 w-4 shrink-0 text-zinc-500";
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M17 13.5a4.8 4.8 0 0 1 4 5.5" />
    </svg>
  );
}

function PagesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v6h6" />
    </svg>
  );
}

function SpacesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1.1Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass()} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 8h.01" />
    </svg>
  );
}
