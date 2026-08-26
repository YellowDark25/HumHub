import { type RefObject, useState } from "react";
import { useRouter } from "next/navigation";
import { compressUploadFiles } from "@/shared/compressUpload";
import { POST_FILE_ACCEPT } from "@/shared/postComposer";
import { readApiError } from "@/shared/readApiError";

/**
 * Rascunho e envio de arquivos para a pasta atual do drive.
 * Comprime, manda FormData com folderId e recarrega a pasta no sucesso.
 * O input de arquivo fica no componente: o ref só é lido no clique e no change.
 */
export function useUploadSpaceFiles(
  spaceId: number,
  folderId = 0,
  onUploaded: () => Promise<void> = async () => {},
  fileInputRef: RefObject<HTMLInputElement | null>,
) {
  const router = useRouter();
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
    form.append("folderId", String(folderId));
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
      await onUploaded();
      router.refresh();
    } catch {
      setError("Falha de rede ao enviar os arquivos.");
    } finally {
      setIsSending(false);
    }
  }

  return {
    files: files ?? [],
    description,
    setDescription,
    error,
    isSending,
    fileAccept: POST_FILE_ACCEPT,
    openFilePicker,
    addFiles,
    removeFile,
    cancelDraft,
    upload,
  };
}
