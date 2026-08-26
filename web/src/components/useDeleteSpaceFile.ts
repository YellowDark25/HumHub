import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SpaceFile } from "@/domain/SpaceFile";
import { readApiError } from "@/shared/readApiError";

/**
 * Controla a exclusão de um arquivo da seção Arquivos do espaço.
 * Abre a confirmação, chama DELETE `/api/spaces/:id/files/:fileId` e
 * atualiza a página; erros de API ou rede ficam em `error`.
 */
export function useDeleteSpaceFile(
  spaceId: number,
  onDeleted: () => Promise<void> = async () => {},
) {
  const router = useRouter();
  const [pending, setPending] = useState<SpaceFile | null>(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Abre o diálogo de confirmação para o arquivo escolhido.
   * Limpa o erro anterior e guarda o arquivo pendente.
   */
  function request(file: SpaceFile) {
    setError("");
    setPending(file);
  }

  /**
   * Fecha o diálogo se a exclusão não estiver em andamento.
   */
  function cancel() {
    if (!isDeleting) {
      setPending(null);
    }
  }

  /**
   * Envia a exclusão do arquivo pendente.
   * Em sucesso fecha o diálogo e pede refresh da página RSC.
   */
  async function confirm() {
    if (!pending || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      const origin = pending.origin === "drive" ? "drive" : "feed";
      const response = await fetch(
        `/api/spaces/${spaceId}/files/${pending.id}?origem=${origin}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setError(
          await readApiError(response, "Não foi possível excluir o arquivo."),
        );
        return;
      }

      setPending(null);
      await onDeleted();
      router.refresh();
    } catch {
      setError("Falha de rede ao excluir o arquivo.");
    } finally {
      setIsDeleting(false);
    }
  }

  return { pending, error, isDeleting, request, cancel, confirm };
}
