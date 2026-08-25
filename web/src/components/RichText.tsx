import type { ReactNode } from "react";
import {
  parseRichText,
  type RichBlock,
  type RichInline,
} from "@/shared/richText";

type RichTextProps = {
  text: string;
  className?: string;
};

export function RichText({ text, className = "" }: RichTextProps) {
  const blocks = parseRichText(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 text-[15px] leading-6 text-zinc-800 ${className}`}>
      {blocks.map((block, index) => (
        <RichBlockView key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  );
}

function RichBlockView({ block }: { block: RichBlock }) {
  switch (block.type) {
    case "pre":
      return (
        <pre className="overflow-x-auto rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800">
          <code>{block.value}</code>
        </pre>
      );
    case "ul":
    case "ol":
      return (
        <ListBlock
          ordered={block.type === "ol"}
          items={block.items}
        />
      );
    case "h1":
      return (
        <h3 className="text-xl font-semibold text-zinc-900">
          {renderInline(block.children)}
        </h3>
      );
    case "h2":
      return (
        <h4 className="text-lg font-semibold text-zinc-900">
          {renderInline(block.children)}
        </h4>
      );
    case "h3":
      return (
        <h5 className="text-base font-semibold text-zinc-900">
          {renderInline(block.children)}
        </h5>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-zinc-300 pl-3 text-zinc-600">
          {renderInline(block.children)}
        </blockquote>
      );
    default:
      return <p className="whitespace-pre-wrap">{renderInline(block.children)}</p>;
  }
}

function ListBlock({
  ordered,
  items,
}: {
  ordered: boolean;
  items: RichInline[][];
}) {
  const List = ordered ? "ol" : "ul";
  return (
    <List className={ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
      {items.map((item, index) => (
        <li key={index}>{renderInline(item)}</li>
      ))}
    </List>
  );
}

function renderInline(nodes: RichInline[]): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "text") {
      return <span key={index}>{node.value}</span>;
    }
    if (node.type === "code") {
      return (
        <code
          key={index}
          className="rounded bg-zinc-100 px-1 py-0.5 text-[13px] text-zinc-800"
        >
          {renderInline(node.children)}
        </code>
      );
    }
    if (node.type === "link") {
      return (
        <a
          key={index}
          href={node.href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-teal-700 underline"
        >
          {renderInline(node.children)}
        </a>
      );
    }
    if (node.type === "bold") {
      return <strong key={index}>{renderInline(node.children)}</strong>;
    }
    if (node.type === "italic") {
      return <em key={index}>{renderInline(node.children)}</em>;
    }
    return (
      <s key={index} className="text-zinc-600">
        {renderInline(node.children)}
      </s>
    );
  });
}
