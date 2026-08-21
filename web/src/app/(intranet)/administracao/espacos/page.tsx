import { errorMessage } from "@/application/errors";
import { AdminNote, AdminPanel, AdminTabs } from "@/components/AdminPanel";
import { LoadError } from "@/components/LoadError";
import type { Space } from "@/domain/Space";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  ADMIN_SPACE_TABS,
  adminSpaceTabHref,
  readAdminSpaceTab,
  type AdminSpaceTabId,
} from "@/shared/adminSection";
import Link from "next/link";

export default async function AdminEspacosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requirePageToken();
  const tab = readAdminSpaceTab(await searchParams);

  let spaces: Space[] = [];
  let loadError = "";

  try {
    if (tab === "visao") {
      spaces = await app.listAdminSpaces(token);
    }
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(error, "Não foi possível carregar os espaços.");
  }

  return (
    <main>
      <AdminPanel
        title="Administração de espaços"
        description={spaceTabDescription(tab)}
        actions={
          tab === "visao" ? (
            <Link
              href="/espacos/novo"
              className="inline-flex h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white"
            >
              Adicionar novo espaço
            </Link>
          ) : null
        }
      >
        <AdminTabs
          items={ADMIN_SPACE_TABS}
          activeId={tab}
          hrefFor={adminSpaceTabHref}
        />
        {loadError ? <LoadError message={loadError} /> : (
          <SpaceTabContent tab={tab} spaces={spaces} />
        )}
      </AdminPanel>
    </main>
  );
}

function SpaceTabContent({
  tab,
  spaces,
}: {
  tab: AdminSpaceTabId;
  spaces: Space[];
}) {
  if (tab === "configuracoes") {
    return (
      <AdminNote>
        Aqui você pode definir as configurações padrão para novos espaços.
        Essas configurações podem ser alteradas individualmente para cada
        espaço.
      </AdminNote>
    );
  }

  if (tab === "permissoes") {
    return (
      <AdminNote>
        Essas opções permitem definir as permissões padrão para todos os
        espaços. Os usuários autorizados podem individualizá-las para cada
        espaço.
      </AdminNote>
    );
  }

  if (spaces.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum espaço encontrado.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
      {spaces.map((space) => (
        <li key={space.id} className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{space.name}</p>
            {space.description ? (
              <p className="mt-1 text-sm text-zinc-500">{space.description}</p>
            ) : null}
          </div>
          <Link
            href={`/espacos/${space.id}`}
            className="shrink-0 text-sm font-medium text-teal-700"
          >
            Abrir
          </Link>
        </li>
      ))}
    </ul>
  );
}

function spaceTabDescription(tab: AdminSpaceTabId) {
  if (tab === "visao") {
    return "Esta Visão Global contém uma lista de ações para cada espaço como visualizar, editar e excluir espaços.";
  }

  return "Configurações e permissões padrão aplicadas aos espaços da rede.";
}
