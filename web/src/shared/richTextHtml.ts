import {
  parseRichText,
  type RichBlock,
  type RichInline,
} from "./richText";

/**
 * Converte o markdown da intranet em HTML para o editor rico.
 * Parseia blocos e serializa cada um (parágrafo, título, lista, citação ou código).
 */
export function richTextToHtml(markdown: string): string {
  return parseRichText(markdown).map(blockToHtml).join("");
}

export function htmlToRichText(html: string): string {
  if (typeof DOMParser === "undefined") {
    return "";
  }

  const document = new DOMParser().parseFromString(
    `<div>${html}</div>`,
    "text/html",
  );
  const root = document.body.firstElementChild;
  if (!root) {
    return "";
  }

  return serializeChildren(root).replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Serializa um bloco do markdown parseado em HTML.
 * `switch` no `type` para o TypeScript distinguir lista (`items`) de texto (`children`).
 */
function blockToHtml(block: RichBlock): string {
  switch (block.type) {
    case "pre":
      return `<pre><code>${escapeHtml(block.value)}</code></pre>`;
    case "ul":
    case "ol": {
      const items = block.items
        .map((item) => `<li>${inlineToHtml(item)}</li>`)
        .join("");
      return `<${block.type}>${items}</${block.type}>`;
    }
    case "quote":
      return `<blockquote>${inlineToHtml(block.children)}</blockquote>`;
    case "h1":
    case "h2":
    case "h3":
      return `<${block.type}>${inlineToHtml(block.children)}</${block.type}>`;
    case "p":
      return `<p>${inlineToHtml(block.children)}</p>`;
  }
}

function inlineToHtml(nodes: RichInline[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return escapeHtml(node.value).replace(/\n/g, "<br>");
      }
      if (node.type === "code") {
        return `<code>${inlineToHtml(node.children)}</code>`;
      }
      if (node.type === "link") {
        return `<a href="${escapeHtml(node.href)}">${inlineToHtml(node.children)}</a>`;
      }
      if (node.type === "bold") {
        return `<strong>${inlineToHtml(node.children)}</strong>`;
      }
      if (node.type === "italic") {
        return `<em>${inlineToHtml(node.children)}</em>`;
      }
      return `<s>${inlineToHtml(node.children)}</s>`;
    })
    .join("");
}

function serializeChildren(node: Node): string {
  return Array.from(node.childNodes)
    .map((child) => serializeNode(child))
    .filter((part) => part !== null)
    .join("\n");
}

function serializeNode(node: Node): string | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tag = element.tagName;
  if (tag === "BR") {
    return "";
  }
  if (tag === "H1") {
    return `# ${serializeInline(element)}`;
  }
  if (tag === "H2") {
    return `## ${serializeInline(element)}`;
  }
  if (tag === "H3") {
    return `### ${serializeInline(element)}`;
  }
  if (tag === "BLOCKQUOTE") {
    return serializeInline(element)
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }
  if (tag === "PRE") {
    return `\`\`\`\n${element.textContent ?? ""}\n\`\`\``;
  }
  if (tag === "UL") {
    return Array.from(element.children)
      .map((item) => `- ${serializeInline(item)}`)
      .join("\n");
  }
  if (tag === "OL") {
    return Array.from(element.children)
      .map((item, index) => `${index + 1}. ${serializeInline(item)}`)
      .join("\n");
  }
  if (tag === "DIV" || tag === "P") {
    if (isBlankBreak(element)) {
      return "";
    }
    if (hasBlockChild(element)) {
      return serializeChildren(element);
    }
    return serializeInline(element);
  }

  return serializeInline(element);
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tag = element.tagName;
  if (tag === "BR") {
    return "\n";
  }

  const inner = Array.from(element.childNodes).map(serializeInline).join("");
  if (tag === "STRONG" || tag === "B") {
    return inner ? `**${inner}**` : "";
  }
  if (tag === "EM" || tag === "I") {
    return inner ? `*${inner}*` : "";
  }
  if (tag === "S" || tag === "STRIKE" || tag === "DEL") {
    return inner ? `~~${inner}~~` : "";
  }
  if (tag === "CODE") {
    return inner ? `\`${inner}\`` : "";
  }
  if (tag === "A") {
    const href = element.getAttribute("href") ?? "";
    return href ? `[${inner || href}](${href})` : inner;
  }

  return inner;
}

function isBlankBreak(element: HTMLElement) {
  return (
    element.childNodes.length === 1 &&
    (element.firstChild as HTMLElement | null)?.tagName === "BR"
  );
}

function hasBlockChild(element: HTMLElement) {
  return Array.from(element.children).some((child) =>
    /^(DIV|P|H1|H2|H3|UL|OL|BLOCKQUOTE|PRE)$/.test(child.tagName),
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
