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
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[96rem] px-4 py-6 lg:px-6">
        {children}
      </div>
    </div>
  );
}
