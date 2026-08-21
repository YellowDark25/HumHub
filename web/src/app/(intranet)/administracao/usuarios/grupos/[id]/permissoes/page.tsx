import { errorMessage, isNotFound } from "@/application/errors";
import { AdminGroupPermissions } from "@/components/AdminGroupPermissions";
import { AdminGroupSubnav } from "@/components/AdminGroupSubnav";
import { LoadError } from "@/components/LoadError";
import type { AdminGroup, AdminGroupPermission } from "@/domain/AdminGroup";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PermissoesDoGrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requirePageToken();
  const groupId = Number((await params).id);

  let group: AdminGroup | null = null;
  let permissions: AdminGroupPermission[] = [];
  let loadError = "";

  try {
    const [loadedGroup, loadedPermissions] = await Promise.all([
      app.getAdminGroup(token, groupId),
      app.listAdminGroupPermissions(token, groupId),
    ]);
    group = loadedGroup;
    permissions = loadedPermissions;
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(
      error,
      "Não foi possível carregar as permissões do grupo.",
    );
  }

  return (
    <main>
      <Link
        href="/administracao/usuarios?aba=grupos"
        className="text-sm font-medium text-teal-700"
      >
        Voltar para Grupos
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
        {group ? `Gerenciar grupo: ${group.name}` : "Gerenciar grupo"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Defina o que os membros deste grupo podem fazer na rede.
      </p>
      {group ? (
        <AdminGroupSubnav groupId={group.id} active="permissions" />
      ) : null}
      {loadError ? <LoadError message={loadError} /> : null}
      {group ? (
        <AdminGroupPermissions groupId={group.id} permissions={permissions} />
      ) : null}
    </main>
  );
}
