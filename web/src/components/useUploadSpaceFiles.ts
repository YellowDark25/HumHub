import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressUploadFiles } from "@/shared/compressUpload";
import { POST_FILE_ACCEPT } from "@/shared/postComposer";
import { readApiError } from "@/shared/readApiError";

export function useUploadSpaceFiles(spaceId: number) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function addFiles(selected: FileList | null) {
    if (!selected?.length) {
      return;
    }

    setError("");
    setFiles((current) => [...current, ...Array.from(selected)]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  function cancelDraft() {
    setFiles([]);
    setDescription("");
    setError("");
  }

  async function upload() {
    if (files.length === 0 || isSending) {
      return;
    }

    setError("");
    setIsSending(true);

    const form = new FormData();
    form.append("description", description);
    for (const file of await compressUploadFiles(files)) {
      form.append("files", file);
    }

    try {
      const response = await fetch(`/api/spaces/${spaceId}/files`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível enviar os arquivos."));
        return;
      }

      cancelDraft();
      router.refresh();
    } catch {
      setError("Falha de rede ao enviar os arquivos.");
    } finally {
      setIsSending(false);
    }
  }

  return {
    files,
    description,
    setDescription,
    error,
    isSending,
    fileInputRef,
    fileAccept: POST_FILE_ACCEPT,
    openFilePicker,
    addFiles,
    removeFile,
    cancelDraft,
    upload,
  };
}
