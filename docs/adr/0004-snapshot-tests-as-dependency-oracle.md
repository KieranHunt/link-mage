# Snapshot tests as the dependency-behaviour oracle

Dependabot PRs auto-merge when CI is green, so green CI must mean "the
runtime dependency did not change observable behaviour". link-mage has one
runtime dependency (`mdast-util-to-markdown`, used to render the Markdown
form) and no daily job to catch a silent regression between manual
releases, so a behaviour-changing bump would otherwise ship to users
unnoticed. We gate on `bun test` snapshot tests over a fixed fixture corpus
of Links (title + url) run through the transformer pipeline and both
render forms. Snapshots are inline in the test file
(`toMatchInlineSnapshot`, supported by the pinned Bun 1.3.14).

## Considered options

- **Snapshot tests (chosen).** Same detection power as A/B — both run the
  same corpus through the same code; only the source of "expected" differs
  (committed snapshot vs fresh baseline run). A fraction of the machinery,
  and the tests also serve ordinary development.
- **Green CI without behaviour tests** (typecheck + build + web-ext lint).
  Proves it compiles and packages, not that it renders the same Link.
- **A/B oracle: git worktrees of baseline and candidate, diff JSON output.**
  Borrowed from the AWS paginators repo, where the alternative was already
  broken committed outputs and 3808 records of scale. Here it buys only
  zero-friction on intentional behaviour changes — a downside, since
  transformer work is the primary development surface.

## Consequences

- Snapshots are inline (`toMatchInlineSnapshot`), living in the test file
  beside the fixture they assert — no `__snapshots__` directory, and the
  fixture, the code path, and the expected output review as one diff.
- A snapshot that changes must be updated in the same PR that changed the
  behaviour; the update is review material, not ceremony. This applies to
  every author — red on behaviour change is not author-gated.
- The oracle covers exactly what the fixture corpus exercises: the
  transformer pipeline and both render forms. It cannot speak to
  clipboard behaviour, extension APIs, or anything outside the corpus.
- A Dependabot bump that changes rendering goes red and waits for a human
  (comment + assign), regardless of semver level.
