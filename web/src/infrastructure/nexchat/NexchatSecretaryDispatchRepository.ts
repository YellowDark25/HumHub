import { ApplicationError } from "@/application/errors";
import type { SecretaryDispatchRepository } from "@/application/ports/SecretaryDispatchRepository";
import type { ChatFile } from "@/domain/ChatFile";
import type { GoogleAccountCredential } from "@/domain/GoogleAccount";
import type { SecretaryHistoryMessage } from "@/domain/SecretaryTurn";
import {
  nexchatServiceFileRequest,
  nexchatServiceRequest,
} from "./serviceClient";

type HistoryResult = {
  success?: boolean;
  messages?: Array<{
    id?: number;
    authorId?: number;
    content?: string;
    isSecretary?: boolean;
    audioFileId?: number | null;
    publishedAt?: string | null;
  }>;
};

type GoogleResult = {
  success?: boolean;
  account?: {
    userId?: number;
    email?: string;
    refreshToken?: string;
    expiresAt?: string | null;
  } | null;
};

/**
 * Cano da secretária contra o HumHub, autenticado pelo segredo do serviço.
 * Responde na DM, lê histórico/áudio e busca o vínculo Google do usuário.
 */
export class NexchatSecretaryDispatchRepository
  implements SecretaryDispatchRepository
{
  /**
   * Envia a fala final como o usuário da secretária.
   */
  async reply(conversationId: number, content: string): Promise<void> {
    const result = await nexchatServiceRequest<{ success?: boolean; error?: string }>(
      {
        path: "secretary-reply",
        method: "POST",
        body: { conversationId, content },
      },
    );
    if (result.success === false) {
      throw new ApplicationError(
        result.error || "Não foi possível responder na conversa.",
        502,
      );
    }
  }

  /**
   * Últimas mensagens da DM, da mais antiga para a mais nova.
   */
  async listHistory(conversationId: number): Promise<SecretaryHistoryMessage[]> {
    const result = await nexchatServiceRequest<HistoryResult>({
      path: "secretary-history",
      query: { conversationId },
    });

    return (result.messages ?? []).map((item) => ({
      id: Number(item.id ?? 0),
      authorId: Number(item.authorId ?? 0),
      content: item.content?.trim() ?? "",
      isSecretary: Boolean(item.isSecretary),
      audioFileId: item.audioFileId ?? null,
      publishedAt: item.publishedAt ?? null,
    }));
  }

  /**
   * Baixa o anexo de áudio para o STT.
   */
  getAudioFile(fileId: number): Promise<ChatFile> {
    return nexchatServiceFileRequest(fileId);
  }

  /**
   * Refresh token do Google daquele usuário, ou null se não conectou.
   */
  async getGoogleAccount(
    userId: number,
  ): Promise<GoogleAccountCredential | null> {
    const result = await nexchatServiceRequest<GoogleResult>({
      path: "secretary-google",
      query: { userId },
    });
    const account = result.account;
    if (!account?.refreshToken) {
      return null;
    }

    return {
      userId: Number(account.userId ?? userId),
      email: account.email?.trim() ?? "",
      refreshToken: account.refreshToken,
      expiresAt: account.expiresAt ?? null,
    };
  }

  /**
   * Liga ou desliga o "digitando" da secretária no Mercure.
   */
  async setTyping(conversationId: number, isTyping: boolean): Promise<void> {
    await nexchatServiceRequest({
      path: "secretary-typing",
      method: "POST",
      body: { conversationId, isTyping },
    });
  }
}
