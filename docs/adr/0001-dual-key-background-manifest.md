# Dual-key background manifest for cross-browser MV3

`public/manifest.json` declares both `background.scripts` and `background.service_worker` pointing at the same `background.js`. Firefox uses `scripts` (event page model; the `service_worker` field is unsupported and surfaces as a `web-ext lint` warning we accept). Chrome MV3 uses `service_worker` and ignores `scripts`. This lets a single source manifest target both browsers without a build-time transform.

## Considered Options

- **Per-browser manifest generation** — emit two manifests from a template at build time. More machinery; only worth it if Firefox and Chrome diverge further (e.g. on permissions or APIs).
- **Firefox-only `scripts`** — works for Firefox today but breaks the planned Chrome port.
- **Chrome-only `service_worker`** — Firefox rejects this with a hard manifest error; not viable.

## Consequences

- `web-ext lint` will always emit one `MANIFEST_FIELD_UNSUPPORTED` warning about `/background/service_worker`. This is expected; do not "fix" it by removing the field.
- If Firefox and Chrome ever require divergent fields beyond the `background.*` block, we'll need to revisit and likely move to per-browser manifest generation.
