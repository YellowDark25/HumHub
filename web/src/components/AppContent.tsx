"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AppContentProps = {
  children: ReactNode;
};

export function AppContent({ children }: AppContentProps) {
  const pathname = usePathname();
  const isChat = pathname.startsWith("/chat");

  if (isChat) {
    return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
  );
}
