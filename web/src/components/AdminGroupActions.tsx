"use client";

import type { AdminGroup } from "@/domain/AdminGroup";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 176;
const MENU_GAP = 4;
const VIEWPORT_PAD = 8;
const FALLBACK_MENU_HEIGHT = 200;

type AdminGroupActionsProps = {
  group: AdminGroup;
  pending: boolean;
  onDelete: () => void;
};

export function AdminGroupActions({
  group,
  pending,
  onDelete,
}: AdminGroupActionsProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function placeMenu() {
      if (!buttonRef.current) {
        return;
      }

      const height = menuRef.current?.offsetHeight || FALLBACK_MENU_HEIGHT;
      setPosition(readMenuPosition(buttonRef.current, height));
    }

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function closeMenu() {
      setIsOpen(false);
    }

    placeMenu();
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeMenu);
    const scrollTimer = window.setTimeout(() => {
      window.addEventListener("scroll", closeMenu, true);
    }, 0);
    return () => {
      window.clearTimeout(scrollTimer);
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={pending}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          if (buttonRef.current) {
            setPosition(
              readMenuPosition(buttonRef.current, FALLBACK_MENU_HEIGHT),
            );
          }

          setIsOpen(true);
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Ações de ${group.name}`}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
      >
        <GearIcon />
        <ChevronIcon />
      </button>
      {isOpen
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={`Ações de ${group.name}`}
              style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
              className="fixed z-50 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
            >
              <Link
                role="menuitem"
                href={`/administracao/usuarios/grupos/${group.id}`}
                className={ITEM_CLASS}
                onClick={() => setIsOpen(false)}
              >
                Configurações
              </Link>
              <Link
                role="menuitem"
                href={`/administracao/usuarios/grupos/${group.id}/permissoes`}
                className={ITEM_CLASS}
                onClick={() => setIsOpen(false)}
              >
                Permissões
              </Link>
              <Link
                role="menuitem"
                href={`/administracao/usuarios/grupos/${group.id}/membros`}
                className={ITEM_CLASS}
                onClick={() => setIsOpen(false)}
              >
                Membros
              </Link>
              {group.canDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  className={ITEM_CLASS}
                  onClick={() => {
                    setIsOpen(false);
                    onDelete();
                  }}
                >
                  Excluir
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function readMenuPosition(button: HTMLElement, menuHeight: number) {
  const rect = button.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD;
  const openUpward = spaceBelow < menuHeight + MENU_GAP;
  const top = openUpward
    ? rect.top - menuHeight - MENU_GAP
    : rect.bottom + MENU_GAP;
  const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_PAD;

  return {
    top: Math.max(VIEWPORT_PAD, top),
    left: Math.min(Math.max(VIEWPORT_PAD, rect.right - MENU_WIDTH), maxLeft),
  };
}

const ITEM_CLASS =
  "flex w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50";

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1.1Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
