import {
  ACCOUNT_PROFILE_TABS,
  accountProfileTabHref,
  type AccountProfileTabId,
} from "@/shared/accountSection";
import Link from "next/link";
import type { ReactNode } from "react";

type AccountPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AccountPanel({ title, description, children }: AccountPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AccountProfileTabs({ tab }: { tab: AccountProfileTabId }) {
  return (
    <nav
      aria-label="Abas do perfil"
      className="mb-5 flex overflow-x-auto border-b border-zinc-200"
    >
      {ACCOUNT_PROFILE_TABS.map((item) => {
        const active = item.id === tab;
        return (
          <Link
            key={item.id}
            href={accountProfileTabHref(item.id)}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap ${
              active
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
