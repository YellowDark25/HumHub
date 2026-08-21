"use client";

import { APP_NAME } from "@/shared/appName";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MyAreaDropdown } from "./MyAreaDropdown";
import { NotificationDropdown } from "./NotificationDropdown";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/pessoas", label: "Pessoas" },
  { href: "/espacos", label: "Espaços" },
  { href: "/chat", label: "Chat" },
];

type AppHeaderProps = {
  displayName: string;
  title: string;
  imageUrl: string;
  isOnline: boolean;
  unseenCount: number;
  isAdmin: boolean;
};

export function AppHeader({
  displayName,
  title,
  imageUrl,
  isOnline,
  unseenCount,
  isAdmin,
}: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-zinc-900">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-0.5">
          <MyAreaDropdown isAdmin={isAdmin} />
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={isNavActive(pathname, link.href)}
              />
            ))}
          </div>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationDropdown unseenCount={unseenCount} />
          </div>
          <UserMenu
            displayName={displayName}
            title={title}
            imageUrl={imageUrl}
            isOnline={isOnline}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium ${
        isActive ? "bg-teal-50 text-teal-800" : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}

function isNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}
