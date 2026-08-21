"use client";

import type { Account } from "@/domain/Account";
import { useState, type FormEvent } from "react";
import {
  AccountFeedback,
  AccountField,
  AccountSubmit,
} from "./AccountField";
import { useAccountForm } from "./useAccountForm";

export function AccountUsernameForm({ account }: { account: Account }) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [username, setUsername] = useState(account.username);
  const [currentPassword, setCurrentPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit({
      url: "/api/account/username",
      body: { username, currentPassword },
      successMessage: "Nome de usuário atualizado.",
      fallbackError: "Não foi possível alterar o nome de usuário.",
    });
    if (saved) {
      setCurrentPassword("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Alterar o nome de usuário pode tornar alguns links inutilizáveis, como
        links antigos para o perfil.
      </p>
      <p className="text-sm text-zinc-500">
        Nome atual: <span className="font-medium text-zinc-800">{account.username}</span>
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
        label="Novo nome de usuário"
        name="username"
        value={username}
        required
        hint="Identificador de login, sem espaços. Ex.: joao.silva"
        onChange={setUsername}
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
