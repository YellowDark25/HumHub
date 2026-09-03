import { errorMessage } from "@/application/errors";
import { ChatShell } from "@/components/ChatShell";
import { LoadError } from "@/components/LoadError";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import type { ReactNode } from "react";

/**
 * Layout persistente do chat: rail, sidebar e painel ficam na mesma árvore.
 * Carrega a navegação; a troca de conversa é aba no cliente, não página nova.
 */
export default async function ChatLayout({
  children: _page,
}: {
  children: ReactNode;
}) {
  const token = await requirePageToken();

  try {
    const navigation = await app.getChatNavigation(token);
    return (
      <ChatShell
        workspaces={navigation.workspaces}
        lists={navigation.lists}
        currentUser={navigation.currentUser}
        spacesWithoutServer={navigation.spacesWithoutServer}
      />
    );
  } catch (error) {
    await redirectIfUnauthorized(error);
    return (
      <main>
        <LoadError
          message={errorMessage(error, "Não foi possível carregar o chat.")}
        />
      </main>
    );
  }
}
