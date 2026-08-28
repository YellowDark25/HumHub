import { AppContent } from "@/components/AppContent";
import { AppHeader } from "@/components/AppHeader";
import { MobileNav } from "@/components/MobileNav";
import { ChatIncomingDirectCall } from "@/components/ChatIncomingDirectCall";
import { ChatVoiceOccupancyProvider } from "@/components/ChatVoiceOccupancy";
import { VoiceCallDock } from "@/components/VoiceCallDock";
import { VoiceCallProvider } from "@/components/VoiceCallProvider";
import { errorMessage, isForbidden, isUnauthorized } from "@/application/errors";
import { LoadError } from "@/components/LoadError";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectToClearSession,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { redirect } from "next/navigation";

/**
 * Layout autenticado da intranet: cabeçalho, voz e conteúdo.
 * Lê o token e o usuário; senha obrigatória e 401 redirecionam;
 * se o HumHub falhar (ex.: 500 na subida do Docker), mostra o erro em vez de derrubar a página.
 */
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

    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-100 p-6">
        <div className="w-full max-w-md">
          <LoadError
            message={errorMessage(
              error,
              "Não foi possível carregar a sessão no HumHub.",
            )}
          />
          <a
            href="/"
            className="mt-4 inline-block text-sm font-medium text-teal-700"
          >
            Tentar de novo
          </a>
        </div>
      </div>
    );
  }
}

/**
 * Casca autenticada: cabeçalho, provedores de voz e a área da página.
 * Recebe o usuário já carregado e a quantidade de notificações não lidas.
 */
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
        <ChatVoiceOccupancyProvider currentUserId={user.id}>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <AppContent>{children}</AppContent>
            <VoiceCallDock />
            <ChatIncomingDirectCall />
            <MobileNav />
          </div>
        </ChatVoiceOccupancyProvider>
      </VoiceCallProvider>
    </div>
  );
}

/**
 * Conta notificações não lidas sem derrubar o layout.
 * Propaga só 401; outro erro vira 0 e vai para o log.
 */
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
