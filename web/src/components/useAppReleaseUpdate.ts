"use client";

import type { AppRelease } from "@/domain/AppRelease";
import { hasAppReleaseUpdate } from "@/domain/AppRelease";
import { readApiError } from "@/shared/readApiError";
import { useEffect, useState } from "react";

const APP_RELEASE_POLL_MS = 60_000;

/**
 * Observa se o Vercel publicou um deploy mais novo que o desta aba.
 * Guarda o primeiro /api/version, consulta de novo a cada minuto e ao voltar
 * para a aba; se o buildId mudar, marca que há atualização.
 * @returns true quando o usuário precisa recarregar.
 */
export function useAppReleaseUpdate(): boolean {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let loaded: AppRelease | null = null;
    let cancelled = false;

    async function checkRelease() {
      if (cancelled || document.visibilityState === "hidden") {
        return;
      }

      try {
        const latest = await fetchAppRelease();
        if (cancelled) {
          return;
        }

        if (!loaded) {
          loaded = latest;
          return;
        }

        if (hasAppReleaseUpdate(loaded, latest)) {
          setHasUpdate(true);
        }
      } catch (error) {
        console.error(
          `Falha ao verificar versão do sistema: ${
            error instanceof Error ? error.message : "erro desconhecido"
          }`,
        );
      }
    }

    void checkRelease();
    const timer = window.setInterval(() => {
      void checkRelease();
    }, APP_RELEASE_POLL_MS);
    const onVisible = () => {
      void checkRelease();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return hasUpdate;
}

/**
 * Lê GET /api/version sem cache do browser.
 * Em resposta de erro, lança com a mensagem da API.
 */
async function fetchAppRelease(): Promise<AppRelease> {
  const response = await fetch("/api/version", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Não foi possível verificar a versão."),
    );
  }

  const payload = (await response.json()) as Partial<AppRelease>;
  if (typeof payload.buildId !== "string") {
    throw new Error("Resposta de versão inválida.");
  }

  return { buildId: payload.buildId };
}
