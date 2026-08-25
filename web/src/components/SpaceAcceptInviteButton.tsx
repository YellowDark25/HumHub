"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readApiError } from "@/shared/readApiError";

type SpaceAcceptInviteButtonProps = {
  spaceId: number;
};

export function SpaceAcceptInviteButton({
  spaceId,
}: SpaceAcceptInviteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function accept() {
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/spaces/invites/${spaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível aceitar o convite."));
        return;
      }

      router.refresh();
    } catch {
      setError("Falha de rede ao aceitar o convite.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void accept()}
        disabled={isSaving}
        className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {isSaving ? "Entrando…" : "Aceitar convite"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
