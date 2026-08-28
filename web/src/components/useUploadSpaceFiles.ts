import { type RefObject, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressUploadFiles } from "@/shared/compressUpload";
import { SPACE_FILE_ACCEPT } from "@/shared/postComposer";
import { readApiError } from "@/shared/readApiError";

/**
 * Rascunho e envio de arquivos para a pasta atual do drive.
 * Copia os arquivos na escolha, guarda descrição e só no Enviar manda POST.
 * O input fica no componente: o ref só é lido no clique e no change.
 */
export function useUploadSpaceFiles(
  spaceId: number,
  folderId = 0,
  onUploaded: () => Promise<void> = async () => {},
  fileInputRef: RefObject<HTMLInputElement | null>,
) {
  const router = useRouter();
  const filesRef = useRef<File[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  /**
   * Abre o seletor nativo de arquivos.
   */
  function openFilePicker() {
    fileInputRef.current?.click();
  }

  /**
   * Inclui os arquivos escolhidos no rascunho, sem enviar.
   * Copia o binário na hora para o Enviar não depender do input já limpo.
   */
  function addFiles(selected: FileList | null) {
    if (!selected?.length) {
      return;
    }

    const next = [...filesRef.current, ...copyPickedFiles(selected)];
    filesRef.current = next;
    setFiles(next);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /**
   * Tira um arquivo do rascunho.
   */
  function removeFile(index: number) {
    const next = filesRef.current.filter((_, fileIndex) => fileIndex !== index);
    filesRef.current = next;
    setFiles(next);
  }

  /**
   * Limpa o rascunho e o erro.
   */
  function cancelDraft() {
    filesRef.current = [];
    setFiles([]);
    setDescription("");
    setError("");
  }

  /**
   * Envia o rascunho (arquivos + descrição) para a pasta atual.
   * Lê do ref para não perder a seleção; em sucesso recarrega o drive.
   */
  async function upload() {
    const pending = filesRef.current;
    if (pending.length === 0 || isSending) {
      return;
    }

    setError("");
    setIsSending(true);

    try {
      const form = new FormData();
      form.append("description", description);
      form.append("folderId", String(folderId));
      for (const file of await compressUploadFiles(pending)) {
        form.append("files", file);
      }

      const response = await fetch(`/api/spaces/${spaceId}/files`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível enviar os arquivos."),
        );
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
    files,
    description,
    setDescription,
    error,
    isSending,
    fileAccept: SPACE_FILE_ACCEPT,
    openFilePicker,
    addFiles,
    removeFile,
    cancelDraft,
    upload,
  };
}

/**
 * Cria cópias independentes dos arquivos do seletor.
 * Evita que limpar o input esvazie o File ainda apontado pelo rascunho.
 */
function copyPickedFiles(selected: FileList): File[] {
  return Array.from(selected).map(
    (file) =>
      new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      }),
  );
}
