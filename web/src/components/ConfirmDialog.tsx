"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "default",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || pending) {
        return;
      }

      onCancelRef.current();
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, pending]);

  if (!open) {
    return null;
  }

  const confirmClass =
    tone === "danger"
      ? "bg-red-700 hover:bg-red-800"
      : "bg-teal-700 hover:bg-teal-800";

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        disabled={pending}
        className="absolute inset-0 bg-zinc-900/50"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl outline-none"
      >
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-zinc-900"
        >
          {title}
        </h2>
        {description ? (
          <p
            id="confirm-dialog-description"
            className="mt-2 text-sm text-zinc-500"
          >
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-60 ${confirmClass}`}
          >
            {pending ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
