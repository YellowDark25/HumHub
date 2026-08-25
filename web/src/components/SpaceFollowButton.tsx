"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readApiError } from "@/shared/readApiError";

type SpaceFollowButtonProps = {
  spaceId: number;
};

export function SpaceFollowButton({ spaceId }: SpaceFollowButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function follow() {
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/spaces/${spaceId}/follow`, {
        method: "POST",
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível seguir este espaço."));
        return;
      }

      router.refresh();
    } catch {
      setError("Falha de rede ao seguir o espaço.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void follow()}
        disabled={isSaving}
        className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {isSaving ? "Entrando…" : "Seguir espaço"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
