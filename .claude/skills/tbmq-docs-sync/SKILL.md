---
name: tbmq-docs-sync
argument-hint: [work-ref: trello-url | gh-issue | PR | branch | "this session"] [--branch <base>]
description: Bring the TBMQ documentation site (tbmq.io) in sync with work that was just done — create, update, fix, or remove docs after a feature lands, a bug is fixed, behavior/config changes, or something is removed. Use this whenever the user says the docs need to reflect finished work — e.g. "document this feature", "update the docs for what we just built", "the docs for X are outdated/wrong", "add a docs page for this Trello ticket", "we removed feature Y, clean up its docs", "write the documentation for this fix", "sync the docs with this PR/branch". The work may originate from a Trello card (TBMQ board), a GitHub issue, a PR, a branch diff, or the current session. Docs live in this Astro + Starlight repo (tbmq.io); the edition (CE / PE) is inferred from the code repo the work was done in (tbmq → CE, tbmq-pe → PE; tbmq-demo has NO docs). Documentation must be derived from the actual shipped code (cited file:symbol), never invented. Investigation is READ-ONLY and there is a hard review gate: show the proposed doc diffs and get approval before writing. NOT for changelog/release notes (that is tbmq-release-notes) and NOT for YAML config-parameter comments (that is tbmq-yaml-comment-style, which auto-triggers).
---

# TBMQ docs sync (shipped work → documentation)

This skill brings the **TBMQ documentation site** in sync with work that has already been done — a new feature, a bug fix, a behavior/config change, or a removal. It decides what documentation needs to be **created, updated, fixed, or removed**, derives every word from the code that actually shipped, drafts the changes in the repo's real conventions, and only writes them after you approve the diffs.

It is an **orchestrator + repo specialist**: it gathers context from the code/spec/ticket, and it knows the concrete authoring conventions of the `tbmq.io` Astro + Starlight repo (the include/stub CE-PE pattern, `DocLink`/`ShowFor`, version constants, the redirects workflow, the CI checks). The detailed repo cheat-sheet lives in `references/tbmq-io-authoring.md` — **read it before drafting any content**.

The failure mode this skill exists to prevent is documentation that drifts from reality: describing behavior the code doesn't have, inventing config keys or defaults, duplicating CE/PE content instead of sharing it, or leaving dead links after a removal. **Docs are derived from code, not from memory.**

## Usage

```
/tbmq-docs-sync [work-ref] [--branch <base>]
```

| Argument / flag | Required | Meaning |
|---|---|---|
| `work-ref` | no | What the docs should reflect: a Trello card URL/id (TBMQ board), a GitHub issue, a PR, a branch/diff to compare, or "this session" for work just done here. If omitted, ask what work to document (and offer to derive it from the current session or the branch diff). |
| `--branch <base>` | no | Base branch in this docs repo to branch from. Default: the repo's integration branch (`develop`). Either way, create a new working branch off the base for the doc changes — never commit directly to the base. |

The edition (CE / PE) is **not** a flag — it's inferred from the code repo the work was done in (see Edition & slugs).

## Where docs live

All TBMQ documentation lives in **this repo** — the tbmq.io Astro + Starlight site (MDX). It is the ONLY place docs are edited; the TBMQ code repos (`tbmq`, `tbmq-pe`) carry no user-facing docs and are read-only sources of truth here.

Create a new branch off the base (`--branch`, default `develop`) before editing. `references/tbmq-io-authoring.md` has the full layout, components, and commands; the essentials you must respect:

- **Shared content** (the actual prose) lives in `src/content/_includes/docs/mqtt-broker/{path}/{page}.mdx`.
- **CE stub** `src/content/docs/docs/{path}/{page}.mdx` imports the include and passes `Products.TBMQ`.
- **PE stub** `src/content/docs/docs/pe/{path}/{page}.mdx` imports the include and passes `Products.TBMQ_PE`.

The `mqtt-broker` segment exists **only** in the include path — it is filesystem-only, never routed. Stub paths and URLs never contain it.
- Never hardcode version strings, never write bare Markdown links between doc pages, and never hand-edit generated redirect files — see the reference.

## Edition & slugs (centralized docs)

Docs are centralized and use the CE/PE stub pattern over a shared include, so **common content is written once** and PE-only content is gated with `<ShowFor …>`. Infer the edition from the code repo the work was done in:

| Code repo | Edition | Docs target |
|---|---|---|
| `tbmq` | CE (Community) | CE stub + shared include (common content). PE inherits it automatically via its stub. |
| `tbmq-pe` | PE (Professional) | PE-only content — added to the shared include gated with `<ShowFor product={props.product} show={[Products.TBMQ_PE]}>`, and/or the PE stub. Do **not** expose it to CE. |
| `tbmq-demo` | demo | **No documentation.** TBMQ Demo has no docs — never produce any. |

If the change is a CE feature that both editions get, it belongs in the shared include (both stubs already render it). If it's PE-exclusive, gate it. When in doubt which edition a change belongs to, ask rather than guessing — leaking a PE feature into CE docs is a real error.

## Workflow — run in order

### 1. Identify the work and gather context (READ-ONLY)
Establish exactly *what changed* before touching any doc. Gather context in this priority order and keep the code as the source of truth:

1. **The shipped code / diff** — the authority. Read the actual change (`git diff`, `git log`, the PR, the merged files). Every behavior you document must trace to a `file:symbol` here.
2. **The Superpowers spec/plan** for the work, if one exists (`docs/superpowers/plans/…`) — captures intent and acceptance criteria.
3. **The originating Trello card / GitHub issue** — the "why" and the definition of done. For a Trello card, set the active board to "TBMQ" first (`mcp__trello__set_active_board`), then `get_card` / `get_acceptance_criteria` / `get_card_comments`. For a GH issue, `gh issue view`.
4. **The current session** — if the work was just done here, the conversation history is valid context.

For a non-trivial code surface, delegate the investigation to **`tbmq-code-audit`** — it enforces read-only, source-built, `file:symbol`-cited findings.

### 2. Determine the doc impact
From what changed, decide the action for each affected doc:
- **Create** — a genuinely new capability with no existing page.
- **Update** — changed behavior, new option/config, new UI on an existing page.
- **Fix** — the docs are now wrong or incomplete (this is also the bug-fix case: does the fix change documented behavior?).
- **Remove** — a feature was removed; its page and all references must go (see the removal checklist in the reference).

**"No user-facing docs needed" is a valid, expected outcome.** Internal refactors, private-API changes, and many bug fixes have no documentation surface. Say so plainly and stop — do not manufacture content to look busy.

### 3. Scope the docs (ask me)
Ask which documentation to touch — user guide, getting-started, reference/API, architecture, installation, etc. I may answer directly, or ask you to **identify the scope from the docs that already exist** for this area (search the include tree, `src/content/_includes/docs/mqtt-broker/`, for the feature's current coverage and propose the set). Don't silently pick a scope for a non-obvious change.

### 4. Locate the docs
Find everything the change touches:
- The include + CE/PE stubs for each affected page.
- **Navigation** — `astro.sidebar.ts` (via `tbmqGuideItems` / `tbmqInstallItems` / `tbmqReferenceItems`) for new/removed pages.
- **Cross-links** — other pages that `<DocLink>` to the affected page.
- **Redirects** — for renames/removals, `src/data/redirects.ts` (then `pnpm generate:redirects`). Details in the reference.

### 5. Draft the changes
Write the diffs in the repo's real conventions (full details in `references/tbmq-io-authoring.md`): shared include for common content, `<ShowFor>` for PE-only, `<DocLink>` for internal links, version constants from `~/data/versions`, `<DocImage>`/`ImageGallery` for images, correct frontmatter/schema. Match the surrounding pages' voice, structure, and terminology. Add version context ("since version …") where the page convention uses it. Reference the originating Trello card / GH issue in the branch/commit, not in the prose.

### 6. Review gate (docs are outward-facing) — hard stop
Present the proposed doc changes **as diffs** and an impact summary, then **stop for explicit approval before writing/committing anything**. Docs ship to the public site; nothing lands without a yes. See Guardrails.

### 7. Apply & verify
After approval, make the changes and validate using the **repo's own instructions** (`CLAUDE.md` + `CONTRIBUTING.md` at the repo root) — do not duplicate or invent commands here; they can change. The reference lists the current check set. **Build policy: the repo requires asking before any build** — ask "Run `pnpm build:fast` to verify, or skip?" rather than building unprompted. Run link/slug checks when you added, renamed, or removed pages or links. Commit with **Conventional Commits** (`docs:` for pure docs). Do not push or open a PR without a separate go-ahead.

## Guardrails (hard stops)

1. **Investigation is READ-ONLY.** Steps 1–4 make no edits to the docs repo. Reading code, searching, and drafting the impact summary are fine; writing MDX is not — until the review gate is passed.
2. **Review gate before writing.** Show the diffs and get an explicit yes before creating/editing/removing any doc file. "Explicit" means the user approved this change — not an earlier one.
3. **Never touch `tbmq-demo` docs** — they don't exist.

## Correctness contract

Every statement about product behavior must trace to a **`file:symbol`** in the shipped code (class / method / field / config key). No invented config keys, defaults, flags, endpoints, or behavior. If the code doesn't answer a question the docs need, **flag it** and ask — a documented guess is worse than an acknowledged gap.

## What needs a human (flag, don't fake)

- **Screenshots / UI images / GIFs** — a new or changed UI usually needs new visuals. You cannot produce these reliably; flag exactly which images are needed and where, and note that I'll generate them separately (e.g. with Claude Design). Reference them with `<DocImage>`/`ImageGallery` once they exist.
- **Ambiguous behavior** the code/spec doesn't settle.
- **Editorial calls** — whether a change is even user-facing, or which edition it belongs to, when it isn't clear-cut.

## Do not duplicate other skills

- **Changelog / release notes** → `tbmq-release-notes`. This skill documents behavior on doc pages; it does not write the changelog.
- **YAML config-parameter comments/descriptions** → `tbmq-yaml-comment-style` (auto-triggers). If the work adds a config key, that skill handles the YAML comment; this skill handles the config's user-facing *doc page*.

## Output / reporting

1. An **impact summary** before writing: what changed (cited), which docs are affected, and the create/update/fix/remove action for each — with the edition/slug noted, and any "no docs needed" conclusion stated plainly.
2. The **drafted doc diffs** for review (gate).
3. After apply: a **final summary** — files changed, checks run and their result, images/other items flagged for a human, and whether anything was deferred.
