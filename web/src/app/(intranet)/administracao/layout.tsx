import { errorMessage, isForbidden } from "@/application/errors";
import { AdminSidebar } from "@/components/AdminSidebar";
import { LoadError } from "@/components/LoadError";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";

export default async function AdministracaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await requirePageToken();
  let loadError = "";

  try {
    await app.requireAdminAccess(token);
  } catch (error) {
    await redirectIfUnauthorized(error);
    loadError = isForbidden(error)
      ? errorMessage(error, "Você não tem permissão para acessar esta área.")
      : errorMessage(error, "Não foi possível abrir a administração.");
  }

  if (loadError) {
    return (
      <main>
        <LoadError message={loadError} />
      </main>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <AdminSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
