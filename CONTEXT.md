# link-mage

A browser extension that captures the active tab as a shareable Link and
places it on the system clipboard, ready to paste into chat apps, docs,
and markdown editors.

## Language

**Page**:
The document open in a browser tab. Has a `title` and a `url`.
_Avoid_: Site, document, webpage.

**Current page**:
The Page in the active tab of the focused window at the moment a Summon
fires.
_Avoid_: Active tab, current tab.

**Link**:
A `text` and a `url`. Built from the Current page, refined by the
transformer pipeline, and rendered to two forms (Rich text and Markdown)
for the system clipboard so whichever the paste target prefers, it gets
a useful representation.
_Avoid_: Magical link (marketing flair, not a domain term), URL (a URL
is just one component of a Link), reference, label.

**Rich text form**:
The Link rendered as `<a href="url">text</a>`, written to the
clipboard's `text/html` slot. Pastes into Notion, Slack, Gmail, or Word
as a clickable, formatted link.
_Avoid_: HTML form, HTML link.

**Markdown form**:
The Link rendered as `[text](url)`, written to the clipboard's
`text/plain` slot. Pastes into Obsidian, GitHub issues, or a code editor
as readable markdown.
_Avoid_: Plain text form, markdown link.

**Summon**:
The act of building a Link from the Current page and writing both forms
to the system clipboard.
_Avoid_: Copy, capture, grab.

**Transformer**:
A step in a pipeline that takes a Link and returns a Link. Every Summon
runs the full pipeline. The first transformer in the pipeline is the
**seed**, which produces the initial Link from the Current page (default
reads `document.title` and `location.href`). Subsequent transformers are
mostly site-specific and pass the Link through unchanged on pages they
don't recognise.
_Avoid_: Filter, plugin, handler.

## Example dialogue

> **Dev:** When the user summons on a regular page, both forms always go
> on the clipboard at once?
>
> **Domain:** Right. Rich text form into the `text/html` slot, markdown
> form into the `text/plain` slot. Whichever form the paste target
> prefers, it gets the right one — the user doesn't pick.
>
> **Dev:** What if the Page has no title?
>
> **Domain:** We fall back to the URL as the link text in both forms.
> The Link is still valid; it's just that title and href look the same.
>
> **Dev:** And restricted pages — `about:config`, the new tab page,
> `addons.mozilla.org`?
>
> **Domain:** We can't reach those, so the Summon fails. The toolbar
> icon flashes the failure variant for a second; nothing lands on the
> clipboard.
