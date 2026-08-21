import { errorMessage } from "@/application/errors";
import { AdminModuleList } from "@/components/AdminModuleList";
import { AdminPanel } from "@/components/AdminPanel";
import { LoadError } from "@/components/LoadError";
import type { AdminModule } from "@/domain/AdminModule";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import Link from "next/link";

export default async function AdminModulosPage() {
  const token = await requirePageToken();

  let modules: AdminModule[] = [];
  let loadError = "";

  try {
    modules = await app.listAdminModules(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = errorMessage(error, "Não foi possível carregar os módulos.");
  }

  return (
    <main>
      <AdminPanel
        title="Módulos"
        description="Esta visão geral mostra todos os módulos instalados e permite que você habilite, desabilite, configure e, claro, desinstale-os. Para descobrir novos módulos, dê uma olhada em nosso Marketplace."
        actions={
          <Link
            href="/marketplace"
            className="inline-flex h-10 items-center rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Visite o Marketplace
          </Link>
        }
      >
        {loadError ? (
          <LoadError message={loadError} />
        ) : (
          <AdminModuleList modules={modules} />
        )}
      </AdminPanel>
    </main>
  );
}
