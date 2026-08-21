import { errorMessage, isNotFound } from "@/application/errors";
import { AdminProfileFieldForm } from "@/components/AdminProfileFieldForm";
import { LoadError } from "@/components/LoadError";
import type {
  AdminProfileCatalog,
  AdminProfileField,
} from "@/domain/AdminProfile";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditarCampoPerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requirePageToken();
  const fieldId = Number((await params).id);

  let field: AdminProfileField | null = null;
  let catalog: AdminProfileCatalog | null = null;
  let loadError = "";

  try {
    [field, catalog] = await Promise.all([
      app.getAdminProfileField(token, fieldId),
      app.listAdminProfileCatalog(token),
    ]);
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar o campo.");
  }

  return (
    <main>
      <Link
        href="/administracao/usuarios?aba=perfis"
        className="text-sm font-medium text-teal-700"
      >
        Voltar para Perfis
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
        {field ? `Editar campo: ${field.title}` : "Editar campo"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Altere o título, a visibilidade e a categoria deste campo.
      </p>
      {loadError ? <LoadError message={loadError} /> : null}
      {field && catalog ? (
        <AdminProfileFieldForm
          field={field}
          categories={catalog.categories}
          fieldTypes={catalog.fieldTypes}
          defaultCategoryId={field.categoryId}
        />
      ) : null}
    </main>
  );
}
