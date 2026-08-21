import { errorMessage, isNotFound } from "@/application/errors";
import { AdminGroupMembers } from "@/components/AdminGroupMembers";
import { AdminGroupSubnav } from "@/components/AdminGroupSubnav";
import { LoadError } from "@/components/LoadError";
import type { AdminGroup, AdminGroupMember } from "@/domain/AdminGroup";
import type { AdminUser } from "@/domain/AdminUser";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MembrosDoGrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requirePageToken();
  const groupId = Number((await params).id);

  let group: AdminGroup | null = null;
  let members: AdminGroupMember[] = [];
  let users: AdminUser[] = [];
  let loadError = "";

  try {
    const [loadedGroup, loadedMembers, listedUsers] = await Promise.all([
      app.getAdminGroup(token, groupId),
      app.listAdminGroupMembers(token, groupId),
      app.listAdminUsers(token),
    ]);
    group = loadedGroup;
    members = loadedMembers;
    users = listedUsers;
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar os membros.");
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
        Adicione ou remova pessoas deste grupo. Todo usuário precisa pertencer
        a pelo menos um grupo.
      </p>
      {group ? <AdminGroupSubnav groupId={group.id} active="members" /> : null}
      {loadError ? <LoadError message={loadError} /> : null}
      {group ? (
        <AdminGroupMembers
          group={group}
          members={members}
          users={users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
          }))}
        />
      ) : null}
    </main>
  );
}
