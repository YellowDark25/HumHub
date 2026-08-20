"use client";

import type { Account, AccountProfile } from "@/domain/Account";
import {
  ACCOUNT_PROFILE_CATEGORIES,
  type AccountProfileCategory,
} from "@/shared/accountProfileFields";
import { useState, type FormEvent } from "react";
import {
  AccountFeedback,
  AccountField,
  AccountSelect,
  AccountSubmit,
  AccountTextarea,
} from "./AccountField";
import { useAccountForm } from "./useAccountForm";

type AccountProfileFormProps = {
  account: Account;
};

export function AccountProfileForm({ account }: AccountProfileFormProps) {
  const { error, success, isSubmitting, submit } = useAccountForm();
  const [categoryId, setCategoryId] = useState<AccountProfileCategory["id"]>(
    "geral",
  );
  const [profile, setProfile] = useState<AccountProfile>(account.profile);
  const category =
    ACCOUNT_PROFILE_CATEGORIES.find((item) => item.id === categoryId) ??
    ACCOUNT_PROFILE_CATEGORIES[0];

  if (!category) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit({
      url: "/api/account/profile",
      body: profile,
      successMessage: "Perfil salvo.",
      fallbackError: "Não foi possível salvar o perfil.",
    });
  }

  function setField(key: keyof AccountProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-sm leading-6 text-zinc-500">
        Aqui você pode editar seus dados gerais de perfil, que estão visíveis
        na página sobre do seu perfil.
      </p>
      <div className="flex flex-wrap gap-4 border-b border-zinc-200">
        {ACCOUNT_PROFILE_CATEGORIES.map((item) => {
          const active = item.id === categoryId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategoryId(item.id)}
              className={`border-b-2 px-1 pb-2 text-sm font-medium ${
                active
                  ? "border-teal-700 text-teal-800"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-4">
        {category.fields.map((field) => {
          const value = profile[field.key];
          if (field.kind === "select") {
            return (
              <AccountSelect
                key={field.key}
                label={field.label}
                name={field.key}
                value={value}
                options={field.options ?? []}
                onChange={(next) => setField(field.key, next)}
              />
            );
          }

          if (field.kind === "textarea") {
            return (
              <AccountTextarea
                key={field.key}
                label={field.label}
                name={field.key}
                value={value}
                onChange={(next) => setField(field.key, next)}
              />
            );
          }

          return (
            <AccountField
              key={field.key}
              label={`${field.label}${field.required ? " *" : ""}`}
              name={field.key}
              value={value}
              required={field.required}
              type={field.kind === "date" ? "date" : "text"}
              onChange={(next) => setField(field.key, next)}
            />
          );
        })}
      </div>
      <AccountFeedback error={error} success={success} />
      <AccountSubmit
        disabled={isSubmitting}
        label="Salvar perfil"
        pendingLabel="Salvando…"
      />
    </form>
  );
}
