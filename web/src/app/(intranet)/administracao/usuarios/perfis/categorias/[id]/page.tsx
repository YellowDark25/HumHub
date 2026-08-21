import { errorMessage, isNotFound } from "@/application/errors";
import { AdminProfileCategoryForm } from "@/components/AdminProfileCategoryForm";
import { LoadError } from "@/components/LoadError";
import type { AdminProfileCategory } from "@/domain/AdminProfile";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditarCategoriaPerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requirePageToken();
  const categoryId = Number((await params).id);

  let category: AdminProfileCategory | null = null;
  let loadError = "";

  try {
    category = await app.getAdminProfileCategory(token, categoryId);
  } catch (error) {
    await redirectIfUnauthorized(error);
    if (isNotFound(error)) {
      notFound();
    }
    loadError = errorMessage(error, "Não foi possível carregar a categoria.");
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
        {category ? `Editar categoria: ${category.title}` : "Editar categoria"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Atualize o nome, a descrição e a ordem desta categoria.
      </p>
      {loadError ? <LoadError message={loadError} /> : null}
      {category ? <AdminProfileCategoryForm category={category} /> : null}
    </main>
  );
}
