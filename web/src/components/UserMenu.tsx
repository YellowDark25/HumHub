"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "./Avatar";
import { LogoutButton } from "./LogoutButton";

const ITEM_CLASS =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50";
const ACTIVE_ITEM_CLASS =
  "flex w-full items-center gap-3 bg-teal-50 px-4 py-2.5 text-left text-sm font-medium text-teal-800";

const ACCOUNT_LINKS = [
  { href: "/perfil", label: "Meu Perfil", icon: ProfileIcon },
  { href: "/configuracoes", label: "Configurações", icon: SettingsIcon },
] as const;

const ADMIN_LINKS = [
  { href: "/administracao", label: "Administração", icon: AdminIcon },
  { href: "/marketplace", label: "Marketplace", icon: MarketplaceIcon },
] as const;

type UserMenuProps = {
  displayName: string;
  imageUrl: string;
  isAdmin: boolean;
};

export function UserMenu({ displayName, imageUrl, isAdmin }: UserMenuProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Conta de ${displayName}`}
        className="flex max-w-52 items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
      >
        <span className="truncate">{displayName}</span>
        <Avatar name={displayName} imageUrl={imageUrl} size="sm" />
        <ChevronIcon />
      </button>
      {isOpen ? (
        <div
          role="menu"
          aria-label="Conta"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {ACCOUNT_LINKS.map((item) => (
            <MenuLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon />}
              isActive={pathname.startsWith(item.href)}
              onNavigate={() => setIsOpen(false)}
            />
          ))}
          {isAdmin ? (
            <>
              <div className="my-1 border-t border-zinc-100" />
              {ADMIN_LINKS.map((item) => (
                <MenuLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<item.icon />}
                  isActive={pathname.startsWith(item.href)}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </>
          ) : null}
          <div className="my-1 border-t border-zinc-100" />
          <LogoutButton className={ITEM_CLASS}>
            <LogoutIcon />
            Sair
          </LogoutButton>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  icon,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className={isActive ? ACTIVE_ITEM_CLASS : ITEM_CLASS}
    >
      {icon}
      {label}
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1.1Z" />
    </svg>
  );
}

function MarketplaceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21 16-9 5-9-5" />
      <path d="m21 12-9 5-9-5" />
      <path d="m3 8 9-5 9 5-9 5Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17 21 12 16 7" />
      <path d="M21 12H9" />
    </svg>
  );
}
