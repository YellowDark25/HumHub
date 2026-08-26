"use client";

import { useRef, useState } from "react";
import type { SpaceDriveAncestor, SpaceFolder } from "@/domain/SpaceDrive";
import { SPACE_FOLDER_NAME_MAX, asDriveList } from "@/domain/SpaceDrive";
import type { SpaceFile } from "@/domain/SpaceFile";
import { fileExtensionLabel, formatFileSize } from "@/shared/chatComposer";
import { formatDriveDate } from "@/shared/format";
import { SPACE_FILE_DESCRIPTION_MAX } from "@/shared/postComposer";
import { spaceDriveHref } from "@/shared/spaceSection";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { ChatComposerAttachments } from "./ChatComposerAttachments";
import { ConfirmDialog } from "./ConfirmDialog";
import { useDeleteSpaceFile } from "./useDeleteSpaceFile";
import { useSpaceDrive } from "./useSpaceDrive";
import { useUploadSpaceFiles } from "./useUploadSpaceFiles";

type SpaceFilesProps = {
  spaceId: number;
  folderId: number;
  canUpload: boolean;
};

/**
 * Drive de arquivos do espaço: pastas, subpastas e envio na pasta atual.
 * Carrega o roster e mostra a tabela no estilo Drive; o ref do input fica aqui, não no hook.
 */
export function SpaceFiles({ spaceId, folderId, canUpload }: SpaceFilesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drive = useSpaceDrive(spaceId, folderId);
  const uploader = useUploadSpaceFiles(
    spaceId,
    folderId,
    drive.reload,
    fileInputRef,
  );
  const deleter = useDeleteSpaceFile(spaceId, drive.reload);
  const [pendingFolder, setPendingFolder] = useState<SpaceFolder | null>(null);
  const error = drive.error || deleter.error || uploader.error;
  const folders = asDriveList(drive.drive?.folders);
  const files = asDriveList(drive.drive?.files);
  const draftFiles = asDriveList(uploader.files);
  const isEmpty = !drive.isLoading && folders.length === 0 && files.length === 0;

  async function confirmFolderDelete() {
    if (!pendingFolder) {
      return;
    }

    const ok = await drive.deleteFolder(pendingFolder.id);
    if (ok) {
      setPendingFolder(null);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DriveBreadcrumb
          spaceId={spaceId}
          ancestors={asDriveList(drive.drive?.ancestors)}
        />
        {canUpload ? (
          <div className="flex items-center gap-1">
            <CreateFolderForm
              disabled={drive.isSaving}
              onCreate={(folderName) => drive.createFolder(folderName)}
            />
            <button
              type="button"
              disabled={uploader.isSending}
              onClick={uploader.openFilePicker}
              title={
                draftFiles.length > 0 ? "Adicionar arquivos" : "Enviar arquivos"
              }
              aria-label={
                draftFiles.length > 0 ? "Adicionar arquivos" : "Enviar arquivos"
              }
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg disabled:opacity-50 ${
                draftFiles.length > 0
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-teal-700"
              }`}
            >
              <UploadFileIcon />
            </button>
          </div>
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        accept={uploader.fileAccept}
        onChange={(event) => uploader.addFiles(event.target.files)}
      />
      {canUpload && draftFiles.length > 0 ? (
        <UploadDraft uploader={uploader} />
      ) : null}
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
      {drive.isLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Carregando arquivos…</p>
      ) : null}
      {isEmpty ? (
        <p className="mt-4 text-sm text-zinc-500">
          Esta pasta está vazia. Crie uma pasta ou envie um arquivo.
        </p>
      ) : null}
      {!drive.isLoading && !isEmpty ? (
        <DriveTable
          spaceId={spaceId}
          folders={folders}
          files={files}
          onDeleteFolder={(folder) => setPendingFolder(folder)}
          onDeleteFile={(file) => deleter.request(file)}
        />
      ) : null}
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
      <ConfirmDialog
        open={pendingFolder !== null}
        title="Excluir esta pasta?"
        description={
          pendingFolder
            ? `${pendingFolder.name} e tudo que está dentro serão removidos.`
            : undefined
        }
        confirmLabel="Excluir"
        tone="danger"
        pending={drive.isSaving}
        onConfirm={() => void confirmFolderDelete()}
        onCancel={() => setPendingFolder(null)}
      />
    </section>
  );
}

/**
 * Caminho da pasta atual, com links para voltar.
 */
function DriveBreadcrumb({
  spaceId,
  ancestors,
}: {
  spaceId: number;
  ancestors: SpaceDriveAncestor[];
}) {
  const path = asDriveList(ancestors);
  const items = path.length > 0 ? path : [{ id: 0, name: "Arquivos" }];

  return (
    <nav className="min-w-0 text-sm font-semibold text-zinc-900">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={`${item.id}-${item.name}`} className="flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <span className="text-zinc-300" aria-hidden="true">
                /
              </span>
            ) : null}
            {index === items.length - 1 ? (
              <span className="truncate">{item.name}</span>
            ) : (
              <Link
                href={spaceDriveHref(spaceId, item.id)}
                className="truncate text-teal-700 hover:underline"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Campo para criar pasta na pasta atual.
 * O ícone abre o input; Enter ou Criar grava o nome e fecha o formulário.
 */
function CreateFolderForm({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: (name: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  async function submit() {
    const created = await onCreate(folderName);
    if (created) {
      setFolderName("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        title="Nova pasta"
        aria-label="Nova pasta"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-amber-600 disabled:opacity-50"
      >
        <NewFolderIcon />
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <input
        value={folderName}
        onChange={(event) => setFolderName(event.target.value)}
        maxLength={SPACE_FOLDER_NAME_MAX}
        autoFocus
        placeholder="Nome da pasta"
        className="h-9 w-44 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-teal-600"
      />
      <button
        type="submit"
        disabled={disabled || !folderName.trim()}
        className="h-9 cursor-pointer rounded-lg bg-zinc-800 px-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        Criar
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen(false);
          setFolderName("");
        }}
        className="h-9 cursor-pointer rounded-lg px-2 text-sm text-zinc-500 hover:bg-zinc-100"
      >
        Cancelar
      </button>
    </form>
  );
}

/**
 * Tabela do drive: nome, dono, data, tamanho e exclusão.
 * Pastas vêm primeiro; cada linha inteira abre a pasta ou o arquivo.
 */
function DriveTable({
  spaceId,
  folders,
  files,
  onDeleteFolder,
  onDeleteFile,
}: {
  spaceId: number;
  folders: SpaceFolder[];
  files: SpaceFile[];
  onDeleteFolder: (folder: SpaceFolder) => void;
  onDeleteFile: (file: SpaceFile) => void;
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-160 border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs font-medium text-zinc-500">
            <th className="py-2.5 pr-4 font-medium">Nome</th>
            <th className="hidden py-2.5 pr-4 font-medium sm:table-cell">
              Proprietário
            </th>
            <th className="hidden py-2.5 pr-4 font-medium md:table-cell">
              Data da modificação
            </th>
            <th className="hidden py-2.5 pr-4 font-medium md:table-cell">
              Tamanho
            </th>
            <th className="w-10 py-2.5">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {folders.map((folder) => (
            <FolderRow
              key={`folder-${folder.id}`}
              spaceId={spaceId}
              folder={folder}
              onDelete={
                folder.canDelete ? () => onDeleteFolder(folder) : undefined
              }
            />
          ))}
          {files.map((file) => (
            <FileRow
              key={`${file.origin}-${file.id}`}
              file={file}
              onDelete={file.canDelete ? () => onDeleteFile(file) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Linha de pasta no estilo Drive: abre a subpasta ou pede exclusão.
 */
function FolderRow({
  spaceId,
  folder,
  onDelete,
}: {
  spaceId: number;
  folder: SpaceFolder;
  onDelete?: () => void;
}) {
  return (
    <tr className="group border-b border-zinc-100 hover:bg-zinc-50">
      <td className="py-2.5 pr-4">
        <Link
          href={spaceDriveHref(spaceId, folder.id)}
          className="flex min-w-0 items-center gap-3"
        >
          <FolderIcon />
          <span className="truncate font-medium text-zinc-800">{folder.name}</span>
        </Link>
      </td>
      <OwnerCell name={folder.authorName} />
      <DateCell value={folder.createdAt} />
      <td className="hidden py-2.5 pr-4 text-zinc-500 md:table-cell">—</td>
      <ActionCell
        onDelete={onDelete}
        label={`Excluir pasta ${folder.name}`}
      />
    </tr>
  );
}

/**
 * Rascunho dos arquivos escolhidos antes do envio.
 */
function UploadDraft({
  uploader,
}: {
  uploader: ReturnType<typeof useUploadSpaceFiles>;
}) {
  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 pb-3">
      <ChatComposerAttachments
        files={asDriveList(uploader.files)}
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
 * Linha de arquivo no estilo Drive: abre/baixa e pede exclusão no menu.
 */
function FileRow({
  file,
  onDelete,
}: {
  file: SpaceFile;
  onDelete?: () => void;
}) {
  return (
    <tr className="group border-b border-zinc-100 hover:bg-zinc-50">
      <td className="py-2.5 pr-4">
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          download={file.isImage || file.isAudio ? undefined : file.name}
          className="flex min-w-0 items-center gap-3"
        >
          <FilePreview file={file} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-zinc-800">
              {file.name}
            </span>
            {file.description ? (
              <span className="block truncate text-xs text-zinc-500">
                {file.description}
              </span>
            ) : null}
          </span>
        </a>
      </td>
      <OwnerCell name={file.authorName} />
      <DateCell value={file.publishedAt} />
      <td className="hidden py-2.5 pr-4 text-zinc-500 md:table-cell">
        {file.sizeBytes > 0 ? formatFileSize(file.sizeBytes) : "—"}
      </td>
      <ActionCell onDelete={onDelete} label={`Excluir ${file.name}`} />
    </tr>
  );
}

/**
 * Célula do dono: avatar com inicial e nome.
 */
function OwnerCell({ name }: { name: string }) {
  const label = name.trim() || "—";

  return (
    <td className="hidden py-2.5 pr-4 sm:table-cell">
      <span className="flex min-w-0 items-center gap-2 text-zinc-600">
        {label !== "—" ? (
          <Avatar name={label} size="xs" shape="circle" />
        ) : null}
        <span className="truncate">{label}</span>
      </span>
    </td>
  );
}

/**
 * Célula da data de alteração no formato do drive.
 */
function DateCell({ value }: { value: string | null }) {
  return (
    <td className="hidden py-2.5 pr-4 text-zinc-500 md:table-cell">
      {formatDriveDate(value)}
    </td>
  );
}

/**
 * Menu de ações da linha: só aparece se o usuário puder excluir.
 */
function ActionCell({
  onDelete,
  label,
}: {
  onDelete?: () => void;
  label: string;
}) {
  return (
    <td className="py-2.5 text-right">
      {onDelete ? (
        <button
          type="button"
          title={label}
          aria-label={label}
          onClick={onDelete}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-700"
        >
          <MoreIcon />
        </button>
      ) : null}
    </td>
  );
}

/**
 * Miniatura do arquivo: imagem real ou selo com a extensão.
 * A URL é a API autenticada do drive; `unoptimized` evita o optimizer sem cookie.
 */
function FilePreview({ file }: { file: SpaceFile }) {
  if (file.isImage) {
    return (
      <Image
        src={file.url}
        alt=""
        width={24}
        height={24}
        unoptimized
        className="h-6 w-6 shrink-0 rounded object-cover"
      />
    );
  }

  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-100 text-[9px] font-semibold tracking-wide text-zinc-500">
      {fileExtensionLabel(file.name)}
    </span>
  );
}

/**
 * Ícone de pasta nova (pasta com mais) do botão da barra.
 */
function NewFolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  );
}

/**
 * Ícone de envio de arquivo da barra do drive.
 */
function UploadFileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 19h14" />
    </svg>
  );
}

/**
 * Ícone de pasta da linha do drive.
 */
function FolderIcon() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-amber-500">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </svg>
    </span>
  );
}

/**
 * Menu de três pontos da linha do drive.
 */
function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}
