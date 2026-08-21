"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AccountField,
  AccountFeedback,
  AccountSubmit,
} from "./AccountField";
import { readApiError } from "@/shared/readApiError";

export function CreateAdminUserForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível criar o usuário."));
        return;
      }

      router.push("/administracao/usuarios");
      router.refresh();
    } catch {
      setError("Falha de rede ao criar o usuário.");
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
        label="Nome de usuário"
        name="username"
        value={username}
        required
        hint="Identificador de login, sem espaços. Ex.: joao.silva"
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
        label="Senha"
        name="password"
        type="password"
        value={password}
        required
        autoComplete="new-password"
        onChange={setPassword}
      />
      <AccountFeedback error={error} success="" />
      <AccountSubmit
        disabled={isSubmitting}
        label="Adicionar usuário"
        pendingLabel="Criando…"
      />
    </form>
  );
}
