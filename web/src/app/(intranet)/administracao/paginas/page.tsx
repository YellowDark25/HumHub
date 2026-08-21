import { errorMessage } from "@/application/errors";
import { AdminNote, AdminPanel, AdminTabs } from "@/components/AdminPanel";
import { LoadError } from "@/components/LoadError";
import type { CustomPage } from "@/domain/CustomPage";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  ADMIN_PAGE_TABS,
  adminPageTabHref,
  readAdminPageTab,
  type AdminPageTabId,
} from "@/shared/adminSection";

export default async function AdminPaginasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requirePageToken();
  const tab = readAdminPageTab(await searchParams);

  let pages: CustomPage[] = [];
  let loadError = "";

  try {
    if (tab === "visao") {
      pages = await app.listCustomPages(token);
    }
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(
      error,
      "Não foi possível carregar as páginas personalizadas.",
    );
  }

  return (
    <main>
      <AdminPanel
        title="Páginas Personalizadas"
        description="Páginas globais, snippets e templates da intranet."
      >
        <AdminTabs
          items={ADMIN_PAGE_TABS}
          activeId={tab}
          hrefFor={adminPageTabHref}
        />
        {loadError ? <LoadError message={loadError} /> : (
          <PageTabContent tab={tab} pages={pages} />
        )}
      </AdminPanel>
    </main>
  );
}

function PageTabContent({
  tab,
  pages,
}: {
  tab: AdminPageTabId;
  pages: CustomPage[];
}) {
  if (tab === "snippets") {
    return (
      <AdminNote>
        Snippets são blocos reutilizáveis exibidos no painel, na barra lateral
        ou em outros alvos da intranet.
      </AdminNote>
    );
  }

  if (tab === "templates") {
    return (
      <AdminNote>
        Templates definem o layout das páginas personalizadas e podem ser
        reutilizados em várias páginas.
      </AdminNote>
    );
  }

  if (tab === "configuracoes") {
    return (
      <AdminNote>
        Ajustes gerais do módulo de páginas personalizadas, como permissões e
        comportamento dos templates.
      </AdminNote>
    );
  }

  if (pages.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Nenhuma página personalizada.</p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
      {pages.map((page) => (
        <li key={page.id} className="px-4 py-4">
          <p className="text-sm font-semibold text-zinc-900">{page.title}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {page.type || "Página"}
            {page.target ? ` · ${page.target}` : ""}
            {page.isAdminOnly ? " · Somente administradores" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
