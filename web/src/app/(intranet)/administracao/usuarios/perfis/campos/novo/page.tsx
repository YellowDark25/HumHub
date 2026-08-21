import { errorMessage } from "@/application/errors";
import { AdminProfileFieldForm } from "@/components/AdminProfileFieldForm";
import { LoadError } from "@/components/LoadError";
import type { AdminProfileCatalog } from "@/domain/AdminProfile";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";

export default async function NovoCampoPerfilPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requirePageToken();
  const raw = (await searchParams).categoria;
  const categoryId = Number(Array.isArray(raw) ? raw[0] : raw);

  let catalog: AdminProfileCatalog | null = null;
  let loadError = "";

  try {
    catalog = await app.listAdminProfileCatalog(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(error, "Não foi possível carregar as categorias.");
  }

  const defaultCategoryId =
    catalog?.categories.some((category) => category.id === categoryId)
      ? categoryId
      : catalog?.categories[0]?.id ?? 0;

  return (
    <main>
      <Link
        href="/administracao/usuarios?aba=perfis"
        className="text-sm font-medium text-teal-700"
      >
        Voltar para Perfis
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900">Novo campo</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Este campo entra na ficha de todas as pessoas da rede.
      </p>
      {loadError ? <LoadError message={loadError} /> : null}
      {catalog && defaultCategoryId > 0 ? (
        <AdminProfileFieldForm
          categories={catalog.categories}
          fieldTypes={catalog.fieldTypes}
          defaultCategoryId={defaultCategoryId}
        />
      ) : null}
    </main>
  );
}
