"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { normalizeLinkUrl } from "@/shared/richText";
import { htmlToRichText, richTextToHtml } from "@/shared/richTextHtml";

export type RichTextPanel = "" | "heading" | "emoji" | "link" | "more";
export type RichTextFormat = "bold" | "italic" | "strike" | "code";
export type RichTextActive = Record<RichTextFormat, boolean> & {
  link: boolean;
};

const EMPTY_ACTIVE: RichTextActive = {
  bold: false,
  italic: false,
  strike: false,
  code: false,
  link: false,
};

type UseRichTextEditorArgs = {
  value: string;
  onChange: (value: string) => void;
};

const FORMAT_COMMAND: Record<Exclude<RichTextFormat, "code">, string> = {
  bold: "bold",
  italic: "italic",
  strike: "strikeThrough",
};

export function useRichTextEditor({ value, onChange }: UseRichTextEditorArgs) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  const [panel, setPanel] = useState<RichTextPanel>("");
  const [active, setActive] = useState<RichTextActive>(EMPTY_ACTIVE);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    const field = editorRef.current;
    if (!field || value === lastValueRef.current) {
      return;
    }

    lastValueRef.current = value;
    field.innerHTML = richTextToHtml(value);
  }, [value]);

  const refreshActive = useCallback(() => {
    setActive(readActiveFormats(editorRef.current));
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, [refreshActive]);

  function emitChange() {
    const field = editorRef.current;
    if (!field) {
      return;
    }

    const next = htmlToRichText(field.innerHTML);
    lastValueRef.current = next;
    onChange(next);
    refreshActive();
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function runCommand(command: string, argument?: string) {
    focusEditor();
    document.execCommand(command, false, argument);
    emitChange();
    setPanel("");
  }

  function format(kind: RichTextFormat) {
    if (kind === "code") {
      wrapCode();
      return;
    }

    runCommand(FORMAT_COMMAND[kind]);
  }

  function wrapCode() {
    focusEditor();
    const selected = window.getSelection()?.toString() ?? "";
    document.execCommand(
      "insertHTML",
      false,
      selected ? `<code>${escapeHtml(selected)}</code>` : "<code>\u200b</code>",
    );
    emitChange();
    setPanel("");
  }

  function heading(level: 0 | 1 | 2 | 3) {
    runCommand("formatBlock", level === 0 ? "P" : `H${level}`);
  }

  function togglePrefix(prefix: string) {
    if (prefix === "> ") {
      runCommand("formatBlock", "BLOCKQUOTE");
      return;
    }
    if (prefix === "- ") {
      runCommand("insertUnorderedList");
      return;
    }
    runCommand("insertOrderedList");
  }

  function insert(text: string) {
    focusEditor();
    document.execCommand("insertText", false, text);
    emitChange();
    setPanel("");
  }

  function applyLink() {
    const url = normalizeLinkUrl(linkUrl);
    if (!url) {
      setLinkError("Informe um endereço http ou https válido.");
      return;
    }

    runCommand("createLink", url);
    setLinkUrl("");
    setLinkError("");
  }

  function togglePanel(next: RichTextPanel) {
    setLinkError("");
    setPanel((current) => (current === next ? "" : next));
  }

  const closePanel = useCallback(() => {
    setPanel("");
    setLinkError("");
  }, []);

  function handleInput() {
    emitChange();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    emitChange();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const withModifier = event.ctrlKey || event.metaKey;
    if (!withModifier) {
      return;
    }

    if (event.key === "b") {
      event.preventDefault();
      format("bold");
      return;
    }
    if (event.key === "i") {
      event.preventDefault();
      format("italic");
      return;
    }
    if (event.key === "e") {
      event.preventDefault();
      format("code");
      return;
    }
    if (event.key === "k") {
      event.preventDefault();
      togglePanel("link");
    }
  }

  return {
    editorRef,
    panel,
    active,
    refreshActive,
    linkUrl,
    linkError,
    setLinkUrl,
    format,
    heading,
    togglePrefix,
    insert,
    applyLink,
    togglePanel,
    closePanel,
    handleInput,
    handlePaste,
    handleKeyDown,
  };
}

function readActiveFormats(editor: HTMLDivElement | null): RichTextActive {
  if (!editor || !selectionIsInside(editor)) {
    return EMPTY_ACTIVE;
  }

  return {
    bold: commandIsActive("bold"),
    italic: commandIsActive("italic"),
    strike: commandIsActive("strikeThrough"),
    code: isInsideTag(editor, "CODE"),
    link: isInsideTag(editor, "A"),
  };
}

function commandIsActive(command: string) {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

function selectionIsInside(editor: HTMLDivElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const node = selection.anchorNode;
  return Boolean(node && editor.contains(node));
}

function isInsideTag(editor: HTMLDivElement, tag: string) {
  const selection = window.getSelection();
  const node = selection?.anchorNode;
  if (!node || !editor.contains(node)) {
    return false;
  }

  const element =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node.parentElement;
  return Boolean(element?.closest(tag));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
