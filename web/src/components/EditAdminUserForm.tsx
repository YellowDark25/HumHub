"use client";

import type { AdminUser } from "@/domain/AdminUser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AccountField,
  AccountFeedback,
  AccountSubmit,
} from "./AccountField";
import { readApiError } from "@/shared/readApiError";

type EditAdminUserFormProps = {
  user: AdminUser;
};

export function EditAdminUserForm({ user }: EditAdminUserFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [title, setTitle] = useState(user.title);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          title,
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível salvar o usuário."));
        return;
      }

      router.push("/administracao/usuarios");
      router.refresh();
    } catch {
      setError("Falha de rede ao salvar o usuário.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <AccountField
        label="Primeiro nome"
        name="firstName"
        value={firstName}
        required
        onChange={setFirstName}
      />
      <AccountField
        label="Último nome"
        name="lastName"
        value={lastName}
        required
        onChange={setLastName}
      />
      <AccountField
        label="Cargo"
        name="title"
        value={title}
        onChange={setTitle}
      />
      <AccountField
        label="Nome de usuário"
        name="username"
        value={username}
        required
        onChange={setUsername}
      />
      <AccountField
        label="E-mail"
        name="email"
        type="email"
        value={email}
        required
        onChange={setEmail}
      />
      <AccountField
        label="Nova senha"
        name="password"
        type="password"
        value={password}
        autoComplete="new-password"
        onChange={setPassword}
      />
      <p className="text-xs text-zinc-400">
        Deixe a senha em branco para manter a atual.
      </p>
      <AccountFeedback error={error} success="" />
      <AccountSubmit
        disabled={isSubmitting}
        label="Salvar"
        pendingLabel="Salvando…"
      />
    </form>
  );
}
