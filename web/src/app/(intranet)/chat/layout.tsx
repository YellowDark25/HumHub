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
 * Layout persistente do chat: rail, sidebar e avatares ficam montados.
 * Carrega a navegação compartilhada; as páginas só trocam o painel da conversa.
 */
export default async function ChatLayout({ children }: { children: ReactNode }) {
  const token = await requirePageToken();

  try {
    const navigation = await app.getChatNavigation(token);
    return (
      <ChatShell
        workspaces={navigation.workspaces}
        lists={navigation.lists}
        currentUser={navigation.currentUser}
        spacesWithoutServer={navigation.spacesWithoutServer}
      >
        {children}
      </ChatShell>
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
