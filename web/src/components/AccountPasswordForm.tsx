"use client";

import { useState, type FormEvent } from "react";
import {
  AccountFeedback,
  AccountField,
  AccountSubmit,
} from "./AccountField";
import { useAccountForm } from "./useAccountForm";

export function AccountPasswordForm() {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit({
      url: "/api/account/password",
      body: { currentPassword, newPassword, newPasswordConfirm },
      successMessage: "Senha atualizada.",
      fallbackError: "Não foi possível alterar a senha.",
    });
    if (saved) {
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
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
      <AccountFeedback error={error} success={success} />
      <AccountSubmit
        disabled={isSubmitting}
        label="Salvar"
        pendingLabel="Salvando…"
      />
    </form>
  );
}
