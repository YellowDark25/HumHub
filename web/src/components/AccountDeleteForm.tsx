"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AccountFeedback,
  AccountField,
  AccountSubmit,
} from "./AccountField";
import { useAccountForm } from "./useAccountForm";

export function AccountDeleteForm() {
  const router = useRouter();
  const { error, isSubmitting, submit } = useAccountForm();
  const [currentPassword, setCurrentPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const confirmed = window.confirm(
      "Tem certeza de que deseja apagar a sua conta? Todos os seus dados pessoais serão excluídos de forma irrevogável.",
    );
    if (!confirmed) {
      return;
    }

    const deleted = await submit({
      url: "/api/account",
      method: "DELETE",
      body: { currentPassword },
      successMessage: "Conta apagada.",
      fallbackError: "Não foi possível apagar a conta.",
      onSuccess: async () => {
        router.replace("/login");
      },
    });
    if (!deleted) {
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        Todos os seus dados pessoais serão excluídos de forma irrevogável.
      </p>
      <AccountField
        label="Senha atual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        required
        onChange={setCurrentPassword}
      />
      <AccountFeedback error={error} success="" />
      <AccountSubmit
        disabled={isSubmitting}
        label="Apagar conta"
        pendingLabel="Apagando…"
        tone="danger"
      />
    </form>
  );
}
