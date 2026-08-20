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
    <div className="mb-4 flex flex-wrap gap-2 border-b border-zinc-200 pb-4">
      {ACCOUNT_PROFILE_TABS.map((item) => {
        const active = item.id === tab;
        return (
          <Link
            key={item.id}
            href={accountProfileTabHref(item.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              active
                ? "bg-teal-700 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
