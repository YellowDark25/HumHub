export type RichInline =
  | { type: "text"; value: string }
  | { type: "bold" | "italic" | "strike" | "code"; children: RichInline[] }
  | { type: "link"; href: string; children: RichInline[] };

export type RichBlock =
  | { type: "p" | "h1" | "h2" | "h3" | "quote"; children: RichInline[] }
  | { type: "ul" | "ol"; items: RichInline[][] }
  | { type: "pre"; value: string };

export type TextRange = {
  value: string;
  start: number;
  end: number;
};

const HEADING_PREFIX: Record<1 | 2 | 3, string> = {
  1: "# ",
  2: "## ",
  3: "### ",
};

const LINE_MARK = /^(#{1,3} |> |- |\d+\. )/;

export function wrapSelection(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix = prefix,
): TextRange {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  if (
    selected.startsWith(prefix) &&
    selected.endsWith(suffix) &&
    selected.length >= prefix.length + suffix.length
  ) {
    const inner = selected.slice(prefix.length, selected.length - suffix.length);
    return { value: before + inner + after, start, end: start + inner.length };
  }

  if (before.endsWith(prefix) && after.startsWith(suffix)) {
    return {
      value:
        before.slice(0, before.length - prefix.length) +
        selected +
        after.slice(suffix.length),
      start: start - prefix.length,
      end: end - prefix.length,
    };
  }

  return {
    value: before + prefix + selected + suffix + after,
    start: start + prefix.length,
    end: end + prefix.length,
  };
}

export function insertAtCursor(
  value: string,
  start: number,
  end: number,
  inserted: string,
): TextRange {
  const next = value.slice(0, start) + inserted + value.slice(end);
  const caret = start + inserted.length;
  return { value: next, start: caret, end: caret };
}

export function wrapAsLink(
  value: string,
  start: number,
  end: number,
  url: string,
): TextRange {
  const selected = value.slice(start, end) || "link";
  const markdown = `[${selected}](${url})`;
  const next = value.slice(0, start) + markdown + value.slice(end);
  const caret = start + markdown.length;
  return { value: next, start: caret, end: caret };
}

export function applyHeading(
  value: string,
  start: number,
  end: number,
  level: 0 | 1 | 2 | 3,
): TextRange {
  const prefix = level === 0 ? "" : HEADING_PREFIX[level];
  return replaceLinePrefixes(value, start, end, () => prefix);
}

export function toggleLinePrefix(
  value: string,
  start: number,
  end: number,
  prefix: string,
): TextRange {
  return replaceLinePrefixes(value, start, end, (current) =>
    current === prefix ? "" : prefix,
  );
}

export function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function parseRichText(markdown: string): RichBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: RichBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      const closed = readFence(lines, index);
      blocks.push({ type: "pre", value: closed.value });
      index = closed.nextIndex;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", children: parseInline(line.slice(2)) });
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", children: parseInline(line.slice(3)) });
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", children: parseInline(line.slice(4)) });
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const group = readPrefixedLines(lines, index, "> ");
      blocks.push({
        type: "quote",
        children: parseInline(group.texts.join("\n")),
      });
      index = group.nextIndex;
      continue;
    }

    if (/^[-*] /.test(line)) {
      const group = readMatchingLines(lines, index, /^[-*] /);
      blocks.push({
        type: "ul",
        items: group.texts.map((item) => parseInline(item.replace(/^[-*] /, ""))),
      });
      index = group.nextIndex;
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const group = readMatchingLines(lines, index, /^\d+\. /);
      blocks.push({
        type: "ol",
        items: group.texts.map((item) => parseInline(item.replace(/^\d+\. /, ""))),
      });
      index = group.nextIndex;
      continue;
    }

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const paragraph = readParagraph(lines, index);
    blocks.push({ type: "p", children: parseInline(paragraph.texts.join("\n")) });
    index = paragraph.nextIndex;
  }

  return blocks;
}

function replaceLinePrefixes(
  value: string,
  start: number,
  end: number,
  nextPrefix: (current: string) => string,
): TextRange {
  const blockStart = value.lastIndexOf("\n", start - 1) + 1;
  const blockEndIndex = value.indexOf("\n", end);
  const blockEnd = blockEndIndex === -1 ? value.length : blockEndIndex;
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split("\n").map((line) => {
    const current = line.match(LINE_MARK)?.[1] ?? "";
    return `${nextPrefix(current)}${line.slice(current.length)}`;
  });
  const nextBlock = lines.join("\n");
  const next = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);
  return {
    value: next,
    start: blockStart,
    end: blockStart + nextBlock.length,
  };
}

function readFence(lines: string[], start: number) {
  const body: string[] = [];
  let index = start + 1;
  while (index < lines.length && !lines[index].startsWith("```")) {
    body.push(lines[index]);
    index += 1;
  }
  return {
    value: body.join("\n"),
    nextIndex: index < lines.length ? index + 1 : index,
  };
}

function readPrefixedLines(lines: string[], start: number, prefix: string) {
  const texts: string[] = [];
  let index = start;
  while (index < lines.length && lines[index].startsWith(prefix)) {
    texts.push(lines[index].slice(prefix.length));
    index += 1;
  }
  return { texts, nextIndex: index };
}

function readMatchingLines(lines: string[], start: number, pattern: RegExp) {
  const texts: string[] = [];
  let index = start;
  while (index < lines.length && pattern.test(lines[index])) {
    texts.push(lines[index]);
    index += 1;
  }
  return { texts, nextIndex: index };
}

function readParagraph(lines: string[], start: number) {
  const texts: string[] = [];
  let index = start;
  while (index < lines.length && !isBlockStart(lines[index])) {
    texts.push(lines[index]);
    index += 1;
  }
  return { texts, nextIndex: index };
}

function isBlockStart(line: string) {
  return (
    line.trim() === "" ||
    line.startsWith("```") ||
    line.startsWith("# ") ||
    line.startsWith("## ") ||
    line.startsWith("### ") ||
    line.startsWith("> ") ||
    /^[-*] /.test(line) ||
    /^\d+\. /.test(line)
  );
}

function parseInline(text: string): RichInline[] {
  return splitInline(text, [
    { type: "code", pattern: /`([^`]+)`/ },
    { type: "link", pattern: /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/ },
    { type: "bold", pattern: /\*\*(.+?)\*\*/ },
    { type: "strike", pattern: /~~(.+?)~~/ },
    { type: "italic", pattern: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/ },
  ]);
}

function splitInline(
  text: string,
  rules: { type: RichInline["type"]; pattern: RegExp }[],
): RichInline[] {
  if (!text) {
    return [];
  }

  const rule = rules[0];
  if (!rule) {
    return [{ type: "text", value: text }];
  }

  const match = rule.pattern.exec(text);
  if (!match || match.index === undefined) {
    return splitInline(text, rules.slice(1));
  }

  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  const inner = match[1] ?? "";
  const node: RichInline =
    rule.type === "link"
      ? { type: "link", href: match[2] ?? "", children: splitInline(inner, rules) }
      : rule.type === "code"
        ? { type: "code", children: [{ type: "text", value: inner }] }
        : {
            type: rule.type as "bold" | "italic" | "strike",
            children: splitInline(inner, rules.slice(1)),
          };

  return [
    ...splitInline(before, rules),
    node,
    ...splitInline(after, rules),
  ];
}
