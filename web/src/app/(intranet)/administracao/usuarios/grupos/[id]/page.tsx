import { errorMessage, isNotFound } from "@/application/errors";
import { AdminGroupForm } from "@/components/AdminGroupForm";
import { AdminGroupSubnav } from "@/components/AdminGroupSubnav";
import { LoadError } from "@/components/LoadError";
import type { AdminGroup } from "@/domain/AdminGroup";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditarGrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requirePageToken();
  const groupId = Number((await params).id);

  let group: AdminGroup | null = null;
  let loadError = "";

  try {
    group = await app.getAdminGroup(token, groupId);
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar o grupo.");
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
        {group ? `Editar grupo: ${group.name}` : "Editar grupo"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Atualize o nome, a visibilidade e as regras deste grupo.
      </p>
      {group ? <AdminGroupSubnav groupId={group.id} active="edit" /> : null}
      {loadError ? <LoadError message={loadError} /> : null}
      {group ? <AdminGroupForm group={group} /> : null}
    </main>
  );
}
