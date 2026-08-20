"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/pessoas", label: "Pessoas" },
  { href: "/espacos", label: "Espaços" },
  { href: "/chat", label: "Chat" },
];

type AppHeaderProps = {
  displayName: string;
  unseenCount: number;
};

export function AppHeader({ displayName, unseenCount }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-zinc-900">
          Intranet
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <NotificationDropdown unseenCount={unseenCount} />
          <UserMenu displayName={displayName} />
        </div>
      </div>
    </header>
  );
}
