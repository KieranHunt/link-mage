// link-mage render forms.
//
// Both clipboard forms of a Link: the Markdown form (rendered by the
// one runtime dependency, mdast-util-to-markdown) and the Rich text
// form (HTML escaping hand-rolled around an anchor element). Extracted
// from the content-script body so tests can exercise rendering — see
// docs/adr/0004-snapshot-tests-as-dependency-oracle.md.

import { toMarkdown } from "mdast-util-to-markdown";
import type { Link } from "./transformers.js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMarkdownForm(link: Link): string {
  return toMarkdown({
    type: "paragraph",
    children: [
      {
        type: "link",
        url: link.url,
        children: [{ type: "text", value: link.text }],
      },
    ],
  }).trimEnd();
}

export function renderRichTextForm(link: Link): string {
  return `<a href="${escapeHtml(link.url)}">${escapeHtml(link.text)}</a>`;
}
