"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/pessoas", label: "Pessoas" },
  { href: "/espacos", label: "Espaços" },
  { href: "/chat", label: "Chat" },
  { href: "/notificacoes", label: "Alertas" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white md:hidden">
      <div className="grid grid-cols-5">
        {LINKS.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`py-3 text-center text-[11px] font-medium ${
                active ? "text-teal-700" : "text-zinc-500"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
