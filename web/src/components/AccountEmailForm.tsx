"use client";

import type { Account } from "@/domain/Account";
import { useState, type FormEvent } from "react";
import {
  AccountFeedback,
  AccountField,
  AccountSubmit,
} from "./AccountField";
import { useAccountForm } from "./useAccountForm";

export function AccountEmailForm({ account }: { account: Account }) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [email, setEmail] = useState(account.email);
  const [currentPassword, setCurrentPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit({
      url: "/api/account/email",
      body: { email, currentPassword },
      successMessage: "E-mail atualizado.",
      fallbackError: "Não foi possível alterar o e-mail.",
    });
    if (saved) {
      setCurrentPassword("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <p className="text-sm text-zinc-500">
        E-mail atual: <span className="font-medium text-zinc-800">{account.email}</span>
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
      <AccountField
        label="Novo e-mail"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        required
        onChange={setEmail}
      />
      <AccountFeedback error={error} success={success} />
      <AccountSubmit
        disabled={isSubmitting}
        label="Salvar"
        pendingLabel="Salvando…"
      />
    </form>
  );
}
