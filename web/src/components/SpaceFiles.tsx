"use client";

import type { SpaceFile } from "@/domain/SpaceFile";
import { fileExtensionLabel, formatFileSize } from "@/shared/chatComposer";
import { formatDate } from "@/shared/format";
import { SPACE_FILE_DESCRIPTION_MAX } from "@/shared/postComposer";
import { ChatComposerAttachments } from "./ChatComposerAttachments";
import { ConfirmDialog } from "./ConfirmDialog";
import { useDeleteSpaceFile } from "./useDeleteSpaceFile";
import { useUploadSpaceFiles } from "./useUploadSpaceFiles";

type SpaceFilesProps = {
  spaceId: number;
  files: SpaceFile[];
  canUpload: boolean;
};

/**
 * Seção Arquivos do espaço: envio, lista e exclusão.
 * Usa os hooks de upload e exclusão; a lista vem da página RSC e some
 * o botão de excluir quando `canDelete` é falso.
 */
export function SpaceFiles({ spaceId, files, canUpload }: SpaceFilesProps) {
  const uploader = useUploadSpaceFiles(spaceId);
  const deleter = useDeleteSpaceFile(spaceId);
  const error = deleter.error || uploader.error;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Arquivos</h2>
        {canUpload ? (
          <button
            type="button"
            disabled={uploader.isSending}
            onClick={uploader.openFilePicker}
            className="h-9 cursor-pointer rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {uploader.files.length > 0 ? "Adicionar arquivos" : "Enviar arquivos"}
          </button>
        ) : null}
      </div>
      <input
        ref={uploader.fileInputRef}
        type="file"
        multiple
        hidden
        accept={uploader.fileAccept}
        onChange={(event) => uploader.addFiles(event.target.files)}
      />
      {canUpload && uploader.files.length > 0 ? (
        <UploadDraft uploader={uploader} />
      ) : null}
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
      {files.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Nenhum arquivo neste espaço.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              onDelete={file.canDelete ? () => deleter.request(file) : undefined}
            />
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={deleter.pending !== null}
        title="Excluir este arquivo?"
        description={
          deleter.pending
            ? `${deleter.pending.name} será removido do espaço. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        tone="danger"
        pending={deleter.isDeleting}
        onConfirm={() => void deleter.confirm()}
        onCancel={deleter.cancel}
      />
    </section>
  );
}

/**
 * Rascunho dos arquivos escolhidos antes do envio.
 * Mostra anexos, descrição opcional e ações de cancelar ou enviar.
 */
function UploadDraft({
  uploader,
}: {
  uploader: ReturnType<typeof useUploadSpaceFiles>;
}) {
  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 pb-3">
      <ChatComposerAttachments
        files={uploader.files}
        onRemove={uploader.removeFile}
      />
      <label className="mx-3 mt-3 block text-sm font-medium text-zinc-700">
        Descrição
        <textarea
          value={uploader.description}
          onChange={(event) => uploader.setDescription(event.target.value)}
          maxLength={SPACE_FILE_DESCRIPTION_MAX}
          rows={3}
          disabled={uploader.isSending}
          placeholder="Opcional. Explique o que é este arquivo…"
          className="mt-1 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-teal-600"
        />
      </label>
      <div className="mt-3 flex justify-end gap-2 px-3">
        <button
          type="button"
          disabled={uploader.isSending}
          onClick={uploader.cancelDraft}
          className="h-9 cursor-pointer rounded-lg px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={uploader.isSending}
          onClick={() => void uploader.upload()}
          className="h-9 cursor-pointer rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {uploader.isSending ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}

/**
 * Linha de um arquivo já enviado, com link de download e exclusão opcional.
 * O botão de excluir fica fora do link para não disparar o download.
 */
function FileRow({
  file,
  onDelete,
}: {
  file: SpaceFile;
  onDelete?: () => void;
}) {
  const meta = [
    file.sizeBytes > 0 ? formatFileSize(file.sizeBytes) : "",
    file.authorName,
    formatDate(file.publishedAt),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-stretch overflow-hidden rounded-xl border border-zinc-200">
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        download={file.isImage || file.isAudio ? undefined : file.name}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 hover:bg-zinc-50"
      >
        <FilePreview file={file} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-zinc-800">
            {file.name}
          </span>
          {file.description ? (
            <span className="mt-0.5 block text-sm text-zinc-600">
              {file.description}
            </span>
          ) : null}
          <span className="mt-0.5 block truncate text-xs text-zinc-400">
            {meta}
          </span>
        </span>
      </a>
      {onDelete ? (
        <button
          type="button"
          title="Excluir arquivo"
          aria-label={`Excluir ${file.name}`}
          onClick={onDelete}
          className="flex w-11 shrink-0 items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-700"
        >
          <TrashIcon />
        </button>
      ) : null}
    </li>
  );
}

/**
 * Miniatura do arquivo: imagem real ou selo com a extensão.
 */
function FilePreview({ file }: { file: SpaceFile }) {
  if (file.isImage) {
    return (
      <img
        src={file.url}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-semibold tracking-wide text-zinc-500">
      {fileExtensionLabel(file.name)}
    </span>
  );
}

/**
 * Ícone de lixeira do botão de excluir arquivo.
 */
function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}
