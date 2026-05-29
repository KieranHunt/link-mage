# Bundled content script and transformer pipeline

The clipboard logic in `copy-link.ts` becomes its own Bun bundle entry,
injected into the Current page via
`chrome.scripting.executeScript({files: ['copy-link.js']})` rather than
`func: copyLink`. The bundle imports a pipeline of `Transformer`
functions (`(link: Link) => Link`) from `src/transformers.ts`, runs them
in order starting from the seed transformer (which produces the initial
Link from `document.title` and `location.href`), then renders the result
into Rich text and Markdown forms and writes the clipboard. This lets us
add site-specific cleanups (e.g. stripping the YouTube `(69)`
notification prefix) as small, testable modules without packing them
into one self-contained function body.

## Considered Options

- **Inline transformers in `copyLink`** — keep the existing
  `func: copyLink` pattern and define every transformer as a function
  inside `copyLink`'s body. Works because of the
  `Function.prototype.toString()` serialization constraint (see
  ADR-0002), but pushes everything into one growing function and
  prevents code reuse across transformers.
- **Pipeline in the background script, two `executeScript`
  round-trips** — first call reads `{title, url}` from the page,
  background runs the pipeline, second call writes the clipboard via
  `args:`. Cleanest module experience, but reverses the
  seed-as-first-transformer model (seeding becomes a separate read step)
  and strips DOM access from transformers — a transformer can no longer
  reach for `<meta property="og:title">` if `document.title` is poor.
- **Declarative transformers as data** — define each transformer as
  JSON-shaped config (URL pattern, regex replacements, etc.) and ship it
  via `args:`. Serializable and easy to register, but the DSL is finite;
  anything not expressible (e.g. extracting a video title from JSON-LD)
  needs an escape hatch into code, defeating the simplicity.

## Consequences

- The build has two entries: `src/background.ts` → `dist/background.js`
  and `src/copy-link.ts` → `dist/copy-link.js`.
- The content script no longer returns through `func:`'s return value.
  The success bool reaches the background either as the IIFE bundle's
  last expression (Bun `--format=iife`) or via
  `chrome.runtime.sendMessage`. The exact mechanism is an implementation
  detail under this ADR.
- ADR-0002 stays valid: the synthetic copy event still fires in the page
  context. It's now wrapped inside a bundled content script rather than
  an inlined function.
- Transformers retain DOM access. Most won't need it (string
  manipulation on `document.title` is enough), but the option is
  preserved for sites where the title is uninformative.
