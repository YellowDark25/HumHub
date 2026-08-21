import Link from "next/link";
import type { ReactNode } from "react";

type AdminPanelProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPanel({
  title,
  description,
  actions,
  children,
}: AdminPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdminTabs<T extends { id: string; label: string }>({
  items,
  activeId,
  hrefFor,
}: {
  items: readonly T[];
  activeId: T["id"];
  hrefFor: (id: T["id"]) => string;
}) {
  return (
    <nav
      aria-label="Abas da administração"
      className="mb-5 flex overflow-x-auto border-b border-zinc-200"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Link
            key={item.id}
            href={hrefFor(item.id)}
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

export function AdminNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm leading-6 text-zinc-500">
      {children}
    </p>
  );
}
