"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readApiError } from "@/shared/readApiError";

export function useAccountForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(input: {
    url: string;
    method?: string;
    body?: unknown;
    successMessage: string;
    fallbackError: string;
    onSuccess?: () => void | Promise<void>;
  }) {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(input.url, {
        method: input.method ?? "PUT",
        headers:
          input.body === undefined
            ? undefined
            : { "Content-Type": "application/json" },
        body:
          input.body === undefined ? undefined : JSON.stringify(input.body),
      });

      if (!response.ok) {
        setError(await readApiError(response, input.fallbackError));
        return false;
      }

      setSuccess(input.successMessage);
      await input.onSuccess?.();
      router.refresh();
      return true;
    } catch {
      setError("Falha de rede ao salvar as configurações.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { error, success, isSubmitting, submit, setError };
}
