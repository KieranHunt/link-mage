// Content-script body for link-mage. Loaded into the Current page as a
// bundled file via `chrome.scripting.executeScript({files: [...]})`
// when a Summon fires. Runs the transformer pipeline to build the Link,
// renders both forms, writes them to the system clipboard via a
// synthetic `copy` event, then reports success back to the background
// script via `chrome.runtime.sendMessage`.
//
// See CONTEXT.md for terminology,
// docs/adr/0002-clipboard-via-synthetic-copy-event.md for the synthetic
// copy event pattern, and
// docs/adr/0003-bundled-content-script-and-transformer-pipeline.md for
// the bundled-content-script architecture.

import { runPipeline } from "./transformers.js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeMd(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/[\[\]]/g, "\\$&");
}

function copyLink(): boolean {
  const link = runPipeline();
  const markdownForm = `[${escapeMd(link.text)}](${link.url})`;
  const richTextForm = `<a href="${escapeHtml(link.url)}">${escapeHtml(link.text)}</a>`;

  let didCopy = false;
  const onCopy = (event: ClipboardEvent): void => {
    if (!event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData("text/plain", markdownForm);
    event.clipboardData.setData("text/html", richTextForm);
    didCopy = true;
  };

  document.addEventListener("copy", onCopy);
  try {
    document.execCommand("copy");
  } finally {
    document.removeEventListener("copy", onCopy);
  }

  return didCopy;
}

const success = copyLink();
void chrome.runtime.sendMessage({ type: "summon-result", success });
