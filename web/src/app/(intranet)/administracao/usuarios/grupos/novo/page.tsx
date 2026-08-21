import { AdminGroupForm } from "@/components/AdminGroupForm";
import Link from "next/link";

export default function NovoGrupoPage() {
  return (
    <main>
      <Link
        href="/administracao/usuarios?aba=grupos"
        className="text-sm font-medium text-teal-700"
      >
        Voltar para Grupos
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
        Criar novo grupo
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Defina o nome e as regras do grupo. Depois você poderá adicionar
        membros.
      </p>
      <AdminGroupForm />
    </main>
  );
}
