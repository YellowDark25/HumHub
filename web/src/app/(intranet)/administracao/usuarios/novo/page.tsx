import { CreateAdminUserForm } from "@/components/CreateAdminUserForm";
import Link from "next/link";

export default function NovoUsuarioPage() {
  return (
    <main>
      <Link
        href="/administracao/usuarios"
        className="text-sm font-medium text-teal-700"
      >
        Voltar para Visão Global
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
        Adicionar novo usuário
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Crie uma conta na rede. A pessoa precisará trocar a senha no primeiro
        acesso.
      </p>
      <CreateAdminUserForm />
    </main>
  );
}
