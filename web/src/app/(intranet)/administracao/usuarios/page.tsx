import { errorMessage } from "@/application/errors";
import { AdminGroupTable } from "@/components/AdminGroupTable";
import { AdminNote, AdminPanel, AdminTabs } from "@/components/AdminPanel";
import { AdminUserTable } from "@/components/AdminUserTable";
import { LoadError } from "@/components/LoadError";
import type { AdminGroup } from "@/domain/AdminGroup";
import type { AdminUser } from "@/domain/AdminUser";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import {
  ADMIN_USER_TABS,
  adminUserTabHref,
  readAdminUserTab,
  type AdminUserTabId,
} from "@/shared/adminSection";
import Link from "next/link";

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requirePageToken();
  const tab = readAdminUserTab(await searchParams);

  let users: AdminUser[] = [];
  let groups: AdminGroup[] = [];
  let currentUserId = 0;
  let loadError = "";

  try {
    if (tab === "grupos") {
      groups = await app.listAdminGroups(token);
    } else if (tab === "visao") {
      const [listed, current] = await Promise.all([
        app.listAdminUsers(token),
        app.getCurrentUser(token),
      ]);
      users = listed;
      currentUserId = current.id;
    }
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(
      error,
      tab === "grupos"
        ? "Não foi possível carregar os grupos."
        : "Não foi possível carregar os usuários.",
    );
  }

  return (
    <main>
      <AdminPanel
        title="Administração de Usuário"
        description={userTabDescription(tab)}
        actions={userTabAction(tab)}
      >
        <AdminTabs
          items={ADMIN_USER_TABS}
          activeId={tab}
          hrefFor={adminUserTabHref}
        />
        {loadError ? <LoadError message={loadError} /> : (
          <UserTabContent
            tab={tab}
            users={users}
            groups={groups}
            currentUserId={currentUserId}
          />
        )}
      </AdminPanel>
    </main>
  );
}

function UserTabContent({
  tab,
  users,
  groups,
  currentUserId,
}: {
  tab: AdminUserTabId;
  users: AdminUser[];
  groups: AdminGroup[];
  currentUserId: number;
}) {
  if (tab === "configuracoes") {
    return (
      <AdminNote>
        Autenticação, convites e aprovação de novos cadastros. Os usuários
        anônimos podem se registrar, membros podem convidar por e-mail ou
        link, e o administrador define se a aprovação pós-registro é
        necessária.
      </AdminNote>
    );
  }

  if (tab === "perfis") {
    return (
      <AdminNote>
        Aqui você pode criar ou editar categorias e campos de perfil usados
        na ficha de cada pessoa.
      </AdminNote>
    );
  }

  if (tab === "pessoas") {
    return (
      <AdminNote>
        Selecione quais informações do usuário devem ser exibidas na visão
        geral Pessoas. Você pode escolher qualquer campo de perfil, inclusive
        os criados individualmente.
      </AdminNote>
    );
  }

  if (tab === "grupos") {
    return <AdminGroupTable groups={groups} />;
  }

  return <AdminUserTable users={users} currentUserId={currentUserId} />;
}

function userTabDescription(tab: AdminUserTabId) {
  if (tab === "grupos") {
    return "Os usuários podem pertencer a diferentes grupos (p. ex. equipes, departamentos etc.) com normas específicas de espaço, gerentes de grupo e permissões.";
  }

  return "Esta visão geral contém uma lista de cada usuário registrado com ações para visualizar, editar e excluir usuários.";
}

function userTabAction(tab: AdminUserTabId) {
  if (tab === "visao") {
    return (
      <Link
        href="/administracao/usuarios/novo"
        className="inline-flex h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white"
      >
        Adicionar novo usuário
      </Link>
    );
  }

  if (tab === "grupos") {
    return (
      <Link
        href="/administracao/usuarios/grupos/novo"
        className="inline-flex h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white"
      >
        Criar novo grupo
      </Link>
    );
  }

  return null;
}
