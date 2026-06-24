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
  [addons.mozilla.org/firefox/addon/link-mage](https://addons.mozilla.org/firefox/addon/link-mage/).
- **Chrome / Chromium** — install from
  [chromewebstore.google.com/detail/link-mage/ijfjlfainigeeepcnjnpkngdgdnajdkl](https://chromewebstore.google.com/detail/link-mage/ijfjlfainigeeepcnjnpkngdgdnajdkl).

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
bun run package         # produces web-ext-artifacts/link-mage-<version>.xpi
bun run package:source  # produces web-ext-artifacts/link-mage-source-<version>.zip
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

## Release

1. Commit and push changes to `main`.
2. In GitHub: Actions → Release → Run workflow.

The workflow generates a UTC timestamp extension version, writes it to
`public/manifest.json` and `package.json`, typechecks, builds, lints,
packages the AMO source zip, commits the generated version to `main`,
then signs and uploads the `.xpi` to the AMO listed channel.

The manifest `version` uses `YYYY.M.DDHH.MMSS`, for example
`2026.6.2409.5925`. The manifest `version_name` stores the matching ISO
UTC timestamp, for example `2026-06-24T09:59:25Z`.

Updates appear on the AMO listing after Mozilla's review.

One-time prerequisites:

- The AMO listing exists (v1.0.0 was uploaded manually through the
  AMO web UI).
- Repository secrets `AMO_API_KEY` and `AMO_API_SECRET` are set
  (generate at
  <https://addons.mozilla.org/developers/addon/api/key>).

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
