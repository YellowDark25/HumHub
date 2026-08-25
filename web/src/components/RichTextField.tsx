"use client";

import { useEffect, useRef } from "react";
import { RichTextToolbar } from "./RichTextToolbar";
import { useRichTextEditor } from "./useRichTextEditor";

type RichTextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  disabled?: boolean;
};

const EDITOR_CLASS =
  "w-full bg-transparent text-[15px] leading-6 text-zinc-900 outline-none disabled:opacity-60 [&_a]:font-medium [&_a]:text-teal-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-600 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_s]:text-zinc-600 [&_ul]:list-disc [&_ul]:pl-5";

export function RichTextField({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
}: RichTextFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editor = useRichTextEditor({ value, onChange });

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        editor.closePanel();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [editor.closePanel]);

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <div className="border-b border-zinc-100 pb-1">
        <RichTextToolbar
          panel={editor.panel}
          active={editor.active}
          linkUrl={editor.linkUrl}
          linkError={editor.linkError}
          disabled={disabled}
          onTogglePanel={editor.togglePanel}
          onFormat={editor.format}
          onHeading={editor.heading}
          onTogglePrefix={editor.togglePrefix}
          onInsert={editor.insert}
          onLinkUrlChange={editor.setLinkUrl}
          onApplyLink={editor.applyLink}
        />
      </div>
      <div
        ref={editor.editorRef}
        role="textbox"
        aria-multiline="true"
        aria-placeholder={placeholder}
        aria-disabled={disabled}
        contentEditable={!disabled}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={editor.handleInput}
        onPaste={editor.handlePaste}
        onKeyDown={editor.handleKeyDown}
        style={{ minHeight: `${rows * 1.5}rem` }}
        className={`${EDITOR_CLASS} ${value.trim() === "" ? "is-empty before:pointer-events-none before:text-zinc-400 before:content-[attr(data-placeholder)]" : ""}`}
      />
    </div>
  );
}
