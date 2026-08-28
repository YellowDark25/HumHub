type PostComposerActionsProps = {
  isSending: boolean;
  canPublish: boolean;
  fileCount: number;
  onPickFiles: () => void;
};

/**
 * Ações do compositor: anexar JPEG, JPG ou PNG e publicar.
 * O clipe abre o seletor; o selo mostra quantas imagens já estão no rascunho.
 */
export function PostComposerActions({
  isSending,
  canPublish,
  fileCount,
  onPickFiles,
}: PostComposerActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        title="Anexar JPEG, JPG ou PNG"
        aria-label="Anexar JPEG, JPG ou PNG"
        disabled={isSending}
        onClick={onPickFiles}
        className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
      >
        <ClipIcon />
        {fileCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-semibold text-white">
            {fileCount}
          </span>
        ) : null}
      </button>
      <button
        type="submit"
        disabled={isSending || !canPublish}
        className="h-9 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSending ? "Publicando…" : "Publicar"}
      </button>
    </div>
  );
}

function ClipIcon() {
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
      <path d="M21.4 11.6 12 21a5 5 0 0 1-7.1-7.1l10.6-10.6a3.2 3.2 0 0 1 4.5 4.5L9.4 18.4a1.4 1.4 0 0 1-2-2l9.2-9.2" />
    </svg>
  );
}
