"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type LogoutButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleLogout}
      className={className ?? "text-sm font-medium text-zinc-500"}
    >
      {children ?? "Sair"}
    </button>
  );
}
