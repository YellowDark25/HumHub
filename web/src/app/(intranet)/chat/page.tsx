import { errorMessage } from "@/application/errors";
import { ChatShell } from "@/components/ChatShell";
import { ChatWelcome } from "@/components/ChatWelcome";
import { LoadError } from "@/components/LoadError";
import type { ChatSidebarSection, ChatWorkspace } from "@/domain/ChatWorkspace";
import type { Space } from "@/domain/Space";
import type { User } from "@/domain/User";
import { app } from "@/infrastructure/composition";
import {
  redirectIfUnauthorized,
  requirePageToken,
} from "@/infrastructure/pageSession";
import { readChatWorkspaceId } from "@/shared/chatWorkspace";

type ChatPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const workspaceId = readChatWorkspaceId(await searchParams);
  const token = await requirePageToken();

  let workspaces: ChatWorkspace[] = [];
  let currentWorkspace: ChatWorkspace | null = null;
  let sections: ChatSidebarSection[] = [];
  let currentUser: User | null = null;
  let spacesWithoutServer: Space[] = [];
  let error = "";

  try {
    const page = await app.getChatHomePage(token, workspaceId);
    workspaces = page.workspaces;
    currentWorkspace = page.currentWorkspace;
    sections = page.sections;
    currentUser = page.currentUser;
    spacesWithoutServer = page.spacesWithoutServer;
  } catch (caught) {
    await redirectIfUnauthorized(caught);
    error = errorMessage(caught, "Não foi possível carregar o chat.");
  }

  if (!currentWorkspace) {
    return (
      <main>
        <LoadError message={error || "Não foi possível carregar o chat."} />
      </main>
    );
  }

  return (
    <ChatShell
      workspaces={workspaces}
      currentWorkspace={currentWorkspace}
      sections={sections}
      currentUser={currentUser}
      spacesWithoutServer={spacesWithoutServer}
    >
      {error ? (
        <div className="p-4">
          <LoadError message={error} />
        </div>
      ) : (
        <ChatWelcome workspace={currentWorkspace} />
      )}
    </ChatShell>
  );
}
