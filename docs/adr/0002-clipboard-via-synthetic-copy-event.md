# Clipboard writes via injected content script + synthetic copy event

When a Summon fires, the background script injects a content script via
`chrome.scripting.executeScript` into the Current page. The content
script registers a one-shot `copy` event handler, calls
`document.execCommand("copy")`, then removes the handler. The handler
calls `event.clipboardData.setData("text/plain", markdownForm)` and
`event.clipboardData.setData("text/html", richTextForm)` — putting both
forms of the Link on the clipboard in a single user-initiated copy
event. Required permissions: `activeTab`, `scripting`, `clipboardWrite`.

## Considered Options

- **`navigator.clipboard.write()` from the background service worker** —
  Chrome MV3 service workers have no DOM, so the modern Clipboard API
  isn't available. Brittle and inconsistent in Firefox too. Not viable.
- **`navigator.clipboard.write(new ClipboardItem({...}))` from the
  content script** — works in Chrome, but Firefox is stricter about user
  activation needing to originate inside the page itself rather than
  from an extension command. Also requires `document.hasFocus()` to be
  true, which silently fails when focus is on the URL bar or devtools.
- **Offscreen document (Chrome) + content script (Firefox)** — two
  divergent code paths, an extra permission (`offscreen`), and no real
  upside: restricted pages still fail under both branches.

The synthetic-copy-event pattern with `clipboardWrite` declared is the
standard cross-browser MV3 idiom for multi-format clipboard writes.
`document.execCommand("copy")` is officially deprecated but remains the
recommended approach in extension contexts; browsers have shown no
signs of dropping it, and the alternatives all carry sharper edges.

## Consequences

- Restricted pages (`about:`, `chrome://`, `addons.mozilla.org`, the new
  tab page, file URLs depending on browser settings) reject script
  injection at the browser level. Summons on those pages fail and the
  failure icon flashes — that's the intended behaviour, not a bug to
  work around.
- If `document.execCommand("copy")` is ever actually removed, this
  decision will need revisiting. The fallback at that point will likely
  be a popup-based UX (where activation is reliably in-page) rather
  than the modern async Clipboard API from a content script.
