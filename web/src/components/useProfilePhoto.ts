"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { readApiError } from "@/shared/readApiError";
import {
  MAX_PROFILE_IMAGE_BYTES,
  PROFILE_IMAGE_MIME_TYPES,
} from "@/shared/profileImage";

export function useProfilePhoto(imageUrl: string) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(file: File | undefined) {
    if (!file || isSaving) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const image = await readFileAsDataUrl(file);
      const response = await fetch("/api/profile/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível atualizar a foto."));
        return;
      }

      setPreviewUrl(image);
      router.refresh();
    } catch {
      setError("Falha de rede ao atualizar a foto.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    fileInputRef,
    displayedUrl: previewUrl || imageUrl,
    error,
    isSaving,
    openFilePicker,
    onFileSelected,
  };
}

function validateImageFile(file: File): string {
  if (!PROFILE_IMAGE_MIME_TYPES.includes(file.type)) {
    return "Envie uma imagem JPG, PNG, GIF ou WebP.";
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return "A imagem deve ter no máximo 2 MB.";
  }

  return "";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}
