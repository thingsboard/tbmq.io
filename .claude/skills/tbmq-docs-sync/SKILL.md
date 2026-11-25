---
name: tbmq-docs-sync
description: Brings the TBMQ documentation site (tbmq.io) in line with work that already shipped — creating, updating, fixing, or removing /docs pages after a feature lands, a bug is fixed, config or behavior changes, or a feature is removed, with every statement derived from the shipped code. Use when the user says the docs need to reflect finished work, such as "document this feature", "update the docs for what we just built", "the docs for X are outdated", "add a docs page for this Trello ticket", "we removed feature Y, clean up its docs", or "sync the docs with this PR/branch". The work may come from a Trello card, GitHub issue, PR, branch diff, or the current session, in the tbmq (CE) or tbmq-pe (PE) repo. Not for changelog or release notes, and not for YAML config-parameter comments.
argument-hint: "[work-ref: trello-url | gh-issue | PR | branch | this-session] [--branch <base>]"
---

# TBMQ docs sync (shipped work → documentation)

This skill brings the TBMQ documentation site in line with work that already shipped — a feature, a
bug fix, a behavior or config change, or a removal. It decides which docs to **create, update, fix,
or remove**, derives every statement from the code that shipped, drafts the changes in the repo's
conventions, and writes them only after the user approves the diffs.

The failure it prevents is docs drifting from reality: describing behavior the code doesn't have,
inventing config keys or defaults, duplicating CE/PE content instead of sharing it, leaking a PE
feature into CE docs, or leaving dead links after a removal. **Docs are derived from code, not from
memory.**

## Hard stops

1. **Investigation is read-only.** Steps 1–5 make no edits to any repo.
2. **Review gate before writing.** Show the diffs and get an explicit yes for *this* change before creating, editing, or removing any doc file. An approval of an earlier change doesn't carry over.
3. **Ask before any build** — "Run `pnpm build:fast` to verify, or skip?" That includes `pnpm lint:linkcheck`, which builds, and `pnpm lint:toc`, which needs a build.
4. **No push or PR** without a separate go-ahead.
5. **`tbmq-demo` has no docs.** Never produce any for it.

## Input

Invoked as `/tbmq-docs-sync [work-ref] [--branch <base>]`. Arguments for this run: `$ARGUMENTS`

| Argument | Meaning |
|---|---|
| `work-ref` | What the docs should reflect: a Trello card (TBMQ board), a GitHub issue, a PR, a branch to diff, or "this session". If omitted — or if it doesn't resolve (no such PR, issue, or branch) — ask, and offer to derive it from the current session or the branch diff. |
| `--branch <base>` | Base branch in this docs repo. Default `develop`, which carries the **next** release. Doc changes go on a new working branch off it; never commit to the base, and never edit a `release/X.Y` branch (that is what deploys to production). |

The edition is not a flag — it comes from the code repo the work was done in:

| Code repo | Edition | Docs target |
|---|---|---|
| `tbmq` | CE | Shared include (both stubs render it) |
| `tbmq-pe` | PE | PE-only content: a `<ShowFor product={props.product} show={[Products.TBMQ_PE]}>` block in a shared include, or a PE-only page (include + PE stub, no CE stub) |
| `tbmq-demo` | — | No documentation |

When it isn't clear which edition a change belongs to, ask.

### Source-of-truth refs in the code repos

Docs on `develop` describe the upcoming release, so verify against the release lines, read with
`git show <ref>:<path>` after a `git fetch` (the checkouts usually sit on feature branches):

| Edition | Repo | Ref |
|---|---|---|
| CE | `tbmq` | `origin/main` |
| PE | `tbmq-pe` | `origin/license` — not `main`, not `release/license/X.Y.Z` |

**PE is not "CE plus extras".** The `license` branch can delete CE classes and config blocks and
replace them with licensed equivalents, and it can lag CE features, so PE behavior never follows
from CE code or merge timing. A CE feature not yet merged into PE is normal, not a discrepancy to
paper over. Diff CE `main` against PE `license` to find the real PE-only deltas.

**Work that isn't merged yet** (an open PR, a feature branch): read *what changed* from the PR or
branch (`gh pr diff`, `git fetch origin pull/<n>/head`), and say in the impact summary that the
release line doesn't have it yet. Ask whether to document it now or after the merge.

## Workflow

Read `references/tbmq-io-authoring.md` before drafting anything — it holds the repo's layout,
components, edition shapes, removal checklist and check set.

### 1. Identify the work and gather context (read-only)

Establish exactly what changed, keeping the code as the authority:

1. **The shipped code or diff.** Read the actual change (`git diff`, `git log`, the PR, the merged files) on the right ref. Every behavior you document must trace to a `file:symbol` here.
2. **The plan or spec**, if one exists — `docs/superpowers/{plans,specs}/` in the code checkout (often untracked or only on the feature branch). It captures intent and acceptance criteria.
3. **The originating ticket.** GitHub issue: `gh issue view`. Trello card: if a Trello MCP server is connected, set the active board to "TBMQ" first, then read the card, its acceptance criteria and comments; if none is connected, ask the user to paste the card.
4. **The current session**, if the work was just done here.

For a large code surface, delegate the investigation to a read-only subagent and hold it to the same
contract: no edits, findings cited as `file:symbol`.

### 2. Determine the doc impact

For each affected doc, pick an action:

- **Create** — a genuinely new capability with no page.
- **Update** — changed behavior, a new option or config, new UI on an existing page.
- **Fix** — the docs are now wrong or incomplete (the bug-fix case: does the fix change documented behavior?). **Change only the statements that are factually wrong.** Leave correct prose byte-identical: add a sentence rather than re-flow a paragraph, replace the wrong token rather than rewrite the line. Re-wording a verified claim silently un-verifies it.
- **Remove** — a feature was removed: its pages and every reference go (removal checklist in the reference).

**"No user-facing docs needed" is a valid outcome.** Internal refactors, private-API changes and
many bug fixes have no documentation surface. Say so plainly and stop.

**Config parameters:** `installation/config.mdx` and `installation/ie-config.mdx` (CE and `pe/`)
are generated from the broker / integration-executor YAML — never hand-edit them. Update the
*prose* page that explains the key, and flag a generator run as a separate step (reference §8).

### 3. Scope the docs — ask the user

Ask which documentation to touch (user guide, getting started, reference/API, architecture,
installation…). The user may answer directly or ask you to derive the scope from existing coverage:
search `src/content/_includes/docs/mqtt-broker/` for the feature and propose the set. Don't silently
pick a scope for a non-obvious change.

### 4. Locate everything the change touches

- The include and stubs of each affected page — open the stub and read its `@includes/…` import; the include path often differs from the slug.
- Navigation in `astro.sidebar.ts` for new or removed pages (reference §5).
- Inbound links: `<DocLink path="…">` in includes, **and** hardcoded `/docs/…` or `/docs/pe/…` URLs anywhere in `src/` (pages, components). A link to a renamed or removed URL is in scope wherever it lives — it fails `lint:linkcheck` — so include the fix in your diffs.
- Redirects for renames and removals (reference §6).
- Prose mentions outside `/docs` — a `/mqtt/` learn page, a marketing page — are out of scope: list them in the impact summary for the user rather than rewording them.

### 5. Draft the changes

Write the diffs in the repo's conventions (reference): shared include for common content,
`<ShowFor>` for PE-only parts, `<DocLink>` for internal links, version constants from
`~/data/versions`, correct frontmatter. Match the voice, structure and terminology of the
surrounding pages, and add "since version …" context where the page convention uses it. Reference
the originating ticket in the branch or commit, not in the prose.

### 6. Review gate — hard stop

Present the impact summary and the proposed changes **as diffs**, then stop for explicit approval.

### 7. Apply and verify

After approval: create the working branch off the base, apply the changes, and validate using the
repo's own instructions — root `CLAUDE.md` is the authority (`CONTRIBUTING.md` summarizes it), and
where either disagrees with the actual tree, the tree wins. The reference lists the current check
set. Run link and slug checks when pages or links were added, renamed or removed (asking before the
build). If you check a TOC in `pnpm dev` after editing an include, restart the dev server first.
Commit with Conventional Commits (`docs:` for pure docs).

## Correctness contract

Every statement about product behavior traces to a `file:symbol` in the shipped code (class, method,
field, or config key). No invented config keys, defaults, flags, endpoints or behavior. When the code
doesn't answer a question the docs need, flag it and ask — a documented guess is worse than an
acknowledged gap.

## Flag for a human, don't fake

- **Screenshots and UI images.** Default to none: describe the exact UI labels in `<Steps>`. If a visual is genuinely necessary, say exactly which image and where; the user produces it separately.
- **Ambiguous behavior** the code or spec doesn't settle.
- **Editorial calls** — whether a change is user-facing at all, or which edition it belongs to.

## Neighbouring work

- **Authoring or auditing a `/docs/` page on its own merits** → the `tbmq-docs-page` skill. This skill decides *what* the shipped work changes and drives the gate; `tbmq-docs-page` is the authority on writing and verifying an individual page.
- **The `/mqtt` learn hub** → the `mqtt-learn-topic` skill.
- **Changelog / release notes** — out of scope. Release notes are hand-written in `src/content/_includes/docs/mqtt-broker/releases.mdx`; use the `tbmq-release-notes` skill if it is installed, otherwise leave them to the user.
- **YAML config-parameter comments** in the broker repo — out of scope (the `tbmq-yaml-comment-style` skill if installed). This skill handles the key's user-facing doc page.

## Output

1. **Impact summary** before any writing: what changed (cited), which docs are affected and the create / update / fix / remove action for each with edition and slug, out-of-scope mentions to flag, and any "no docs needed" conclusion stated plainly.
2. **The drafted diffs** for review (the gate).
3. **Final summary** after applying: files changed, checks run and their results, items flagged for a human, anything deferred.
