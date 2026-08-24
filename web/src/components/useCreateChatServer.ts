"use client";

import { useRef, useState } from "react";
import {
  MAX_PROFILE_IMAGE_BYTES,
  PROFILE_IMAGE_MIME_TYPES,
} from "@/shared/profileImage";
import { readApiError } from "@/shared/readApiError";

export const MAX_SERVER_NAME_LENGTH = 45;

export function useCreateChatServer(defaultName: string) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(defaultName);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [enablingSpaceId, setEnablingSpaceId] = useState(0);

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
    setImageDataUrl(await readFileAsDataUrl(file));
  }

  function clearImage() {
    setImageDataUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function createServer() {
    const trimmedName = name.trim();
    if (!trimmedName || isSaving) {
      return null;
    }

    setError("");
    setIsSaving(true);

    try {
      const spaceId = await postChatServer({ name: trimmedName });
      if (imageDataUrl) {
        await tryUploadSpaceImage(spaceId, imageDataUrl);
      }
      return spaceId;
    } catch (caught) {
      setError(errorMessage(caught, "Não foi possível criar o servidor."));
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function enableExistingSpace(spaceId: number) {
    if (!spaceId || isSaving || enablingSpaceId) {
      return null;
    }

    setError("");
    setEnablingSpaceId(spaceId);

    try {
      return await postChatServer({ spaceId });
    } catch (caught) {
      setError(errorMessage(caught, "Não foi possível adicionar o servidor."));
      return null;
    } finally {
      setEnablingSpaceId(0);
    }
  }

  return {
    fileInputRef,
    name,
    setName,
    imageDataUrl,
    error,
    isSaving,
    enablingSpaceId,
    openFilePicker,
    onFileSelected,
    clearImage,
    createServer,
    enableExistingSpace,
  };
}

async function postChatServer(body: { name: string } | { spaceId: number }) {
  const response = await fetch("/api/chat/servers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível criar o servidor."));
  }

  const payload = (await response.json()) as { id?: number };
  if (!payload.id) {
    throw new Error("Não foi possível abrir o servidor criado.");
  }

  return payload.id;
}

async function tryUploadSpaceImage(spaceId: number, image: string) {
  const response = await fetch(`/api/spaces/${spaceId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "image", image }),
  });

  return response.ok;
}

function validateImageFile(file: File) {
  if (!PROFILE_IMAGE_MIME_TYPES.includes(file.type)) {
    return "Envie uma imagem JPG, PNG, GIF ou WebP.";
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return "A imagem deve ter no máximo 2 MB.";
  }

  return "";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}
