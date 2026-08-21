import { AppContent } from "@/components/AppContent";
import { AppHeader } from "@/components/AppHeader";
import { MobileNav } from "@/components/MobileNav";
import { isUnauthorized } from "@/application/errors";
import { app } from "@/infrastructure/composition";
import { requirePageToken } from "@/infrastructure/pageSession";
import { clearAuthToken } from "@/infrastructure/session";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await requirePageToken();

  let displayName = "Você";
  let title = "";
  let imageUrl = "";
  let isOnline = false;
  let unseenCount = 0;
  let isAdmin = false;

  try {
    const user = await app.getCurrentUser(token);
    displayName = user.name;
    title = user.title;
    imageUrl = user.imageUrl;
    isOnline = user.isOnline;
    isAdmin = user.isAdmin;
    unseenCount = await loadUnseenCount(token);
  } catch (error) {
    if (isUnauthorized(error)) {
      await clearAuthToken();
      redirect("/login");
    }

    throw error;
  }

  return (
    <div className="flex h-full flex-col bg-zinc-100">
      <AppHeader
        displayName={displayName}
        title={title}
        imageUrl={imageUrl}
        isOnline={isOnline}
        unseenCount={unseenCount}
        isAdmin={isAdmin}
      />
      <AppContent>{children}</AppContent>
      <MobileNav />
    </div>
  );
}

async function loadUnseenCount(token: string): Promise<number> {
  try {
    return await app.countUnseenNotifications(token);
  } catch (error) {
    if (isUnauthorized(error)) {
      throw error;
    }

    console.error(
      `Falha ao contar notificações não lidas: ${error instanceof Error ? error.message : "erro desconhecido"}`,
    );
    return 0;
  }
}
