"use client";

import type { ReactNode } from "react";

type ChatTabLinkProps = {
  className?: string;
  title?: string;
  children: ReactNode;
  onOpen: () => void;
};

/**
 * Item da lista do chat (contato, canal ou servidor), não um link de página.
 * O clique só avisa o shell para trocar o painel ao lado.
 */
export function ChatTabLink({
  className,
  title,
  children,
  onOpen,
}: ChatTabLinkProps) {
  return (
    <button
      type="button"
      title={title}
      className={className}
      onClick={onOpen}
    >
      {children}
    </button>
  );
}
