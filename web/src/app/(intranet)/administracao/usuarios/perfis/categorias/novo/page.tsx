import { AdminProfileCategoryForm } from "@/components/AdminProfileCategoryForm";
import Link from "next/link";

export default function NovaCategoriaPerfilPage() {
  return (
    <main>
      <Link
        href="/administracao/usuarios?aba=perfis"
        className="text-sm font-medium text-teal-700"
      >
        Voltar para Perfis
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
        Nova categoria
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Agrupe campos da ficha, como dados gerais, contato ou redes.
      </p>
      <AdminProfileCategoryForm />
    </main>
  );
}
