// link-mage transformer pipeline.
//
// A Transformer is a function from Link to Link. Every Summon runs the
// full pipeline: starting from a placeholder Link, the seed transformer
// produces the initial Link from the Current page, then site-specific
// transformers refine it. Most transformers pass the Link through
// unchanged on pages they don't recognise.
//
// See CONTEXT.md for terminology and
// docs/adr/0003-bundled-content-script-and-transformer-pipeline.md for
// architecture.

export type Link = {
  readonly text: string;
  readonly url: string;
};

export type Transformer = (link: Link) => Link;

// Reads document.title and location.href from the Current page. Falls
// back to the URL as the link text when the title is empty, so every
// Link starts valid — subsequent transformers can rely on text being
// non-empty.
const seed: Transformer = () => ({
  text: document.title.trim() || location.href,
  url: location.href,
});

// Strips the unread-notification prefix YouTube prepends to
// document.title on watch pages, e.g. "(69) " in
// "(69) Nano Workshop: I Turned 1 Metre Into ... - YouTube".
const youtube: Transformer = (link) => {
  if (new URL(link.url).hostname !== "www.youtube.com") return link;
  return { ...link, text: link.text.replace(/^\(\d+\)\s+/, "") };
};

const transformers: Transformer[] = [seed, youtube];

export function runPipeline(): Link {
  const initial: Link = { text: "", url: "" };
  return transformers.reduce((link, t) => t(link), initial);
}
