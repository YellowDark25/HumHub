"use client";

import type { ReactNode } from "react";

type ChatTabLinkProps = {
  className?: string;
  title?: string;
  "aria-label"?: string;
  children: ReactNode;
  onOpen: () => void;
};

/**
 * Item da lista do chat (contato, canal ou servidor), não um link de página.
 * O clique só avisa o shell para trocar o painel; aceita aria-label do badge.
 */
export function ChatTabLink({
  className,
  title,
  "aria-label": ariaLabel,
  children,
  onOpen,
}: ChatTabLinkProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      className={className}
      onClick={onOpen}
    >
      {children}
    </button>
  );
}
