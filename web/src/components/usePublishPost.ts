import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { POST_FILE_ACCEPT } from "@/shared/postComposer";
import { readApiError } from "@/shared/readApiError";

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

  function addFiles(selected: FileList | null) {
    if (!selected?.length) {
      return;
    }

    setFiles((current) => [...current, ...Array.from(selected)]);
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
    for (const file of files) {
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
