"use client";

import { useState } from "react";
import { useAppReleaseUpdate } from "./useAppReleaseUpdate";

/**
 * Aviso flutuante quando o Vercel já publicou outra versão desta aba.
 * Oferece recarregar agora ou dispensar até a próxima visita.
 */
export function AppUpdateBanner() {
  const hasUpdate = useAppReleaseUpdate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!hasUpdate || isDismissed) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl border border-teal-200 bg-white px-3 py-2.5 shadow-lg"
      >
        <p className="min-w-0 flex-1 text-sm text-zinc-800">
          Há uma nova versão do sistema. Atualize para acompanhar o último
          deploy.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Atualizar
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="shrink-0 rounded-lg px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Dispensar aviso de atualização"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
