import { AppContent } from "@/components/AppContent";
import { AppHeader } from "@/components/AppHeader";
import { MobileNav } from "@/components/MobileNav";
import { VoiceCallDock } from "@/components/VoiceCallDock";
import { VoiceCallProvider } from "@/components/VoiceCallProvider";
import { isForbidden, isUnauthorized } from "@/application/errors";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectToClearSession,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await requirePageToken();

  try {
    const user = await app.getCurrentUser(token);
    const unseenCount = await loadUnseenCount(token);
    return <IntranetShell user={user} unseenCount={unseenCount}>{children}</IntranetShell>;
  } catch (error) {
    if (isForbidden(error)) {
      redirect("/trocar-senha");
    }

    if (isUnauthorized(error)) {
      redirectToClearSession();
    }

    throw error;
  }
}

function IntranetShell({
  user,
  unseenCount,
  children,
}: {
  user: User;
  unseenCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-100">
      <AppHeader
        displayName={user.name}
        title={user.title}
        imageUrl={user.imageUrl}
        isOnline={user.isOnline}
        unseenCount={unseenCount}
        isAdmin={user.isAdmin}
      />
      <VoiceCallProvider currentUser={user}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AppContent>{children}</AppContent>
          <VoiceCallDock />
          <MobileNav />
        </div>
      </VoiceCallProvider>
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
