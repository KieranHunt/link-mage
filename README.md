# Link Mage

Summon ✨ magical links ✨

A browser extension that captures the active tab as a shareable Link
and places it on the system clipboard, ready to paste into chat apps,
docs, and markdown editors.

## What it does

Press a single keystroke (or click the toolbar icon) and the current
page lands on your clipboard as a Link in two forms:

- **Rich text form** — `<a href="url">title</a>`, written to the
  clipboard's `text/html` slot. Pastes into Notion, Slack, Gmail, or
  Word as a clickable, formatted link.
- **Markdown form** — `[title](url)`, written to the clipboard's
  `text/plain` slot. Pastes into Obsidian, GitHub issues, or a code
  editor as readable markdown.

Whichever form the paste target prefers, it gets a useful
representation. You don't pick.

A small pipeline of site-specific transformers cleans up the link text
where the raw page title isn't quite right — for example, stripping
YouTube's `(69) ` unread-notification prefix from watch-page titles.

## Install

- **Firefox** — install from
  [addons.mozilla.org](https://addons.mozilla.org) (TBD: link added
  after first review).
- **Chrome / Chromium** — not yet published; build from source (see
  below) and load `dist/` as an unpacked extension via
  `chrome://extensions`.

## Use

- Press **Alt+Shift+L** to summon a Link from the active tab.
- Or click the 🧙 toolbar icon.
- The icon flashes ✅ on success and ❌ on failure (e.g. on restricted
  pages like `about:config`, the new tab page, or `addons.mozilla.org`,
  where extensions can't reach).

## Build from source

Reproduces the published `dist/` directory that ships inside the .xpi.

### Prerequisites

- [Bun](https://bun.com) 1.3.14 (pinned in `mise.toml`). If you use
  [mise](https://mise.jdx.dev), `mise install` picks it up
  automatically. Otherwise install Bun 1.3.14 directly.

### Build

```sh
bun install
bun run build
```

Output lands in `dist/`:

- `dist/manifest.json` — copied verbatim from `public/manifest.json`
- `dist/background.js` — bundle of `src/background.ts`
- `dist/copy-link.js` — bundle of `src/copy-link.ts` (IIFE format,
  loaded as a content script)
- `dist/icons/` — copied verbatim from `public/icons/`

### Package for distribution

```sh
bun run package         # produces web-ext-artifacts/link-mage-1.0.0.xpi
bun run package:source  # produces web-ext-artifacts/link-mage-source-1.0.0.zip
```

The `.xpi` is what gets uploaded to AMO. The source zip is what AMO's
reviewer uses to reproduce the build.

### Develop

```sh
bun run dev:firefox     # build, watch sources, run a Firefox dev profile
bun run dev:chromium    # same, against Chromium
```

### Verify

```sh
bun run typecheck       # tsc --noEmit
bun run lint:ext        # web-ext lint against dist/
```

`web-ext lint` will always emit one `MANIFEST_FIELD_UNSUPPORTED`
warning about `/background/service_worker`. That's expected — see
[ADR-0001](docs/adr/0001-dual-key-background-manifest.md).

## Project layout

- [`CONTEXT.md`](CONTEXT.md) — domain glossary (Page, Link, Summon,
  Transformer, etc.). Read this first if you're contributing.
- [`docs/adr/`](docs/adr) — architecture decision records explaining
  the cross-browser manifest, the synthetic-copy-event clipboard
  pattern, and the bundled-content-script pipeline.
- [`src/`](src) — TypeScript sources for the background script,
  content script, and transformer pipeline.
- [`public/`](public) — static assets copied verbatim into the build:
  `manifest.json` and `icons/`.
- [`scripts/`](scripts) — icon generator and source-zip packager.

## Support

File issues at <https://github.com/KieranHunt/link-mage/issues>.

## License

[MIT](LICENSE) © 2026 Kieran Hunt
