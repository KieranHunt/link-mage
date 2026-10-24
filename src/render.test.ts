// Oracle fixture corpus for link-mage rendering — see
// docs/adr/0004-snapshot-tests-as-dependency-oracle.md. Each fixture
// stubs the Current page globals, runs the real transformer pipeline
// end to end (seed included), and snapshots both render forms of the
// Link. Never hand-edit the snapshots: regenerate with
// `bun test --update-snapshots`.

import { describe, expect, test } from "bun:test";
import { renderMarkdownForm, renderRichTextForm } from "./render.js";
import { runPipeline } from "./transformers.js";

// Bun's test runner has no DOM; the seed transformer reads these
// globals at call time, so a minimal per-fixture stub is enough.
function stubPage(title: string, href: string): void {
  globalThis.document = { title } as unknown as Document;
  globalThis.location = { href } as unknown as Location;
}

function renderCurrentPage(): { markdownForm: string; richTextForm: string } {
  const link = runPipeline();
  return {
    markdownForm: renderMarkdownForm(link),
    richTextForm: renderRichTextForm(link),
  };
}

describe("render forms over the fixture corpus", () => {
  test("plain unicode title", () => {
    stubPage(
      "Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ — a build diary",
      "https://kieran.example/notes/nano-workshop",
    );
    expect(renderCurrentPage()).toMatchInlineSnapshot(`
      {
        "markdownForm": "[Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ — a build diary](https://kieran.example/notes/nano-workshop)",
        "richTextForm": "<a href="https://kieran.example/notes/nano-workshop">Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ — a build diary</a>",
      }
    `);
  });

  test("empty title falls back to the URL as link text", () => {
    stubPage("   ", "https://example.com/untitled-page");
    expect(renderCurrentPage()).toMatchInlineSnapshot(`
      {
        "markdownForm": "<https://example.com/untitled-page>",
        "richTextForm": "<a href="https://example.com/untitled-page">https://example.com/untitled-page</a>",
      }
    `);
  });

  test("YouTube watch page with unread-count title prefix strips it", () => {
    stubPage(
      "(69) Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ - YouTube",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(renderCurrentPage()).toMatchInlineSnapshot(`
      {
        "markdownForm": "[Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ - YouTube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
        "richTextForm": "<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ - YouTube</a>",
      }
    `);
  });

  test("YouTube watch page without prefix passes through", () => {
    stubPage(
      "Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ - YouTube",
      "https://www.youtube.com/watch?v=ZbZSe6N_BXs",
    );
    expect(renderCurrentPage()).toMatchInlineSnapshot(`
      {
        "markdownForm": "[Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ - YouTube](https://www.youtube.com/watch?v=ZbZSe6N_BXs)",
        "richTextForm": "<a href="https://www.youtube.com/watch?v=ZbZSe6N_BXs">Nano Workshop: I Turned 1 Metre Into a Haunted Maze ✨ - YouTube</a>",
      }
    `);
  });

  test("non-YouTube page with the same prefix does not strip it", () => {
    stubPage(
      "(69) Not YouTube: a page carrying the unread prefix",
      "https://vimeo.com/76979871",
    );
    expect(renderCurrentPage()).toMatchInlineSnapshot(`
      {
        "markdownForm": "[(69) Not YouTube: a page carrying the unread prefix](https://vimeo.com/76979871)",
        "richTextForm": "<a href="https://vimeo.com/76979871">(69) Not YouTube: a page carrying the unread prefix</a>",
      }
    `);
  });

  test("markdown-escaping torture", () => {
    stubPage(
      'Escaping torture: [brackets] \\backslash (parens) & spaces in the title (v2)',
      "https://example.com/wiki/[draft] (v2)/page one",
    );
    expect(renderCurrentPage()).toMatchInlineSnapshot(`
      {
        "markdownForm": "[Escaping torture: \\[brackets\\] \\backslash (parens) & spaces in the title (v2)](<https://example.com/wiki/[draft] (v2)/page one>)",
        "richTextForm": "<a href="https://example.com/wiki/[draft] (v2)/page one">Escaping torture: [brackets] \\backslash (parens) &amp; spaces in the title (v2)</a>",
      }
    `);
  });

  test("rich-form-escaping torture", () => {
    stubPage(
      '"Rich" <torture> & Tom & Jerry — "quotes" and <angle brackets>',
      'https://example.com/search?q="a & b"',
    );
    expect(renderCurrentPage()).toMatchInlineSnapshot(`
      {
        "markdownForm": "["Rich" \\<torture> & Tom & Jerry — "quotes" and \\<angle brackets>](<https://example.com/search?q="a & b">)",
        "richTextForm": "<a href="https://example.com/search?q=&quot;a &amp; b&quot;">&quot;Rich&quot; &lt;torture&gt; &amp; Tom &amp; Jerry — &quot;quotes&quot; and &lt;angle brackets&gt;</a>",
      }
    `);
  });
});
