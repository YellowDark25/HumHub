import { errorMessage, isNotFound } from "@/application/errors";
import { EditAdminUserForm } from "@/components/EditAdminUserForm";
import { LoadError } from "@/components/LoadError";
import type { AdminUser } from "@/domain/AdminUser";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requirePageToken();
  const userId = Number((await params).id);

  let user: AdminUser | null = null;
  let loadError = "";

  try {
    user = await app.getAdminUser(token, userId);
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar o usuário.");
  }

  return (
    <main>
      <Link
        href="/administracao/usuarios"
        className="text-sm font-medium text-teal-700"
      >
        Voltar para Visão Global
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
        {user ? `Editar usuário: ${user.name}` : "Editar usuário"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Atualize os dados da conta. A senha só muda se você preencher o campo.
      </p>
      {loadError ? <LoadError message={loadError} /> : null}
      {user ? <EditAdminUserForm user={user} /> : null}
    </main>
  );
}
