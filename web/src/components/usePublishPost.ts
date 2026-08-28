import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { compressUploadFiles } from "@/shared/compressUpload";
import { isPostImageFile, POST_FILE_ACCEPT } from "@/shared/postComposer";
import { readApiError } from "@/shared/readApiError";

/**
 * Rascunho e envio de uma publicação do feed.
 * Acumula texto e JPEG/JPG/PNG, comprime, manda POST /api/posts e recarrega no sucesso.
 */
export function usePublishPost(spaceId: number) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canPublish = message.trim() !== "" || files.length > 0;

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  /**
   * Inclui no rascunho só JPEG, JPG ou PNG.
   * Descarta outros tipos, avisa no compositor e limpa o input para novo clique.
   */
  function addFiles(selected: FileList | null) {
    if (!selected?.length) {
      return;
    }

    const picked = Array.from(selected);
    const images = picked.filter(isPostImageFile);
    setError(
      images.length === picked.length
        ? ""
        : "Só é possível anexar imagens JPEG, JPG ou PNG.",
    );
    if (images.length > 0) {
      setFiles((current) => [...current, ...images]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  async function publish() {
    if (!canPublish || !spaceId) {
      return;
    }

    setError("");
    setIsSending(true);

    const form = new FormData();
    form.append("spaceId", String(spaceId));
    form.append("message", message);
    for (const file of await compressUploadFiles(files)) {
      form.append("files", file);
    }

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        setError(await readApiError(response, "Não foi possível publicar."));
        return;
      }

      setMessage("");
      setFiles([]);
      router.refresh();
    } catch {
      setError("Falha de rede ao publicar.");
    } finally {
      setIsSending(false);
    }
  }

  return {
    message,
    setMessage,
    files,
    error,
    isSending,
    canPublish,
    fileInputRef,
    fileAccept: POST_FILE_ACCEPT,
    openFilePicker,
    addFiles,
    removeFile,
    publish,
  };
}
