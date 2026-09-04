"use client";

import type { GoogleAccountStatus } from "@/domain/GoogleAccount";
import { readApiError } from "@/shared/readApiError";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AccountFeedback, AccountSubmit } from "./AccountField";
import { useAccountForm } from "./useAccountForm";

type AccountGoogleConnectProps = {
  status: GoogleAccountStatus;
};

/**
 * Liga ou desliga o Google Calendar/Tasks da secretária.
 * POST inicia o OAuth; DELETE apaga o refresh token gravado.
 */
export function AccountGoogleConnect({ status }: AccountGoogleConnectProps) {
  const search = useSearchParams();
  const { error, success, isSubmitting, submit, setError } = useAccountForm();
  const [connected, setConnected] = useState(status.connected);
  const [email, setEmail] = useState(status.email);
  const callbackError = search.get("google") === "erro";
  const callbackOk = search.get("google") === "ok";

  async function connect() {
    setError("");
    try {
      const response = await fetch("/api/account/google", { method: "POST" });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível abrir o Google."));
        return;
      }

      const started = (await response.json()) as { url?: string };
      if (!started.url) {
        setError("O Google não devolveu o endereço de autorização.");
        return;
      }

      window.location.href = started.url;
    } catch {
      setError("Falha de rede ao abrir o Google.");
    }
  }

  async function disconnect() {
    const ok = await submit({
      url: "/api/account/google",
      method: "DELETE",
      successMessage: "Google desconectado.",
      fallbackError: "Não foi possível desconectar o Google.",
    });
    if (ok) {
      setConnected(false);
      setEmail("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600">
        A secretária usa esta conta para ler e alterar sua agenda e suas
        tarefas no Google. Nada fica copiado numa tabela nossa.
      </p>
      {connected ? (
        <p className="text-sm text-zinc-800">
          Conectado como <strong>{email || "Google"}</strong>.
        </p>
      ) : (
        <p className="text-sm text-zinc-500">Nenhuma conta Google ligada.</p>
      )}
      <div className="flex flex-wrap gap-3">
        {connected ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void disconnect();
            }}
          >
            <AccountSubmit
              label="Desconectar"
              pendingLabel="Desconectando…"
              disabled={isSubmitting}
              tone="danger"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => void connect()}
            className="h-11 self-start rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white"
          >
            Conectar Google
          </button>
        )}
      </div>
      <AccountFeedback
        error={error || (callbackError ? "Não foi possível concluir o vínculo Google." : "")}
        success={
          success || (callbackOk && !error ? "Google conectado." : "")
        }
      />
    </div>
  );
}
