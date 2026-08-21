"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AccountFeedback,
  AccountField,
  AccountSubmit,
} from "@/components/AccountField";
import { readApiError } from "@/shared/readApiError";

export function RequiredPasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/required-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, newPasswordConfirm }),
      });

      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível definir a nova senha."),
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Falha de rede ao definir a nova senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AccountField
        label="Nova senha"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        required
        onChange={setNewPassword}
      />
      <AccountField
        label="Confirmar nova senha"
        name="newPasswordConfirm"
        type="password"
        autoComplete="new-password"
        value={newPasswordConfirm}
        required
        onChange={setNewPasswordConfirm}
      />
      <AccountFeedback error={error} success="" />
      <AccountSubmit
        disabled={isSubmitting}
        label="Salvar e entrar"
        pendingLabel="Salvando…"
      />
    </form>
  );
}
