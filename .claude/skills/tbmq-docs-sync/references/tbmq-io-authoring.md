# tbmq.io authoring cheat-sheet

Concrete conventions for editing the TBMQ documentation site (Astro + Starlight, MDX). This is a
distilled pointer: the repo's root `CLAUDE.md` is the living authority, with `CONTRIBUTING.md` as the
contributor-facing summary. If anything here disagrees with them, they win; where they disagree with
the actual tree, the tree wins.

## Contents
1. Content layout and edition shapes
2. Product-conditional content
3. Internal links, images, version strings
4. Frontmatter
5. Sidebar
6. Redirects
7. Removal checklist
8. Verification, CI, generated pages
9. Style

---

## 1. Content layout and edition shapes

Common content is written **once** in a shared include; thin stubs import it and pass their product.

```
src/content/_includes/docs/mqtt-broker/{include-path}.mdx   ← actual content (shared)
src/content/docs/docs/{slug}.mdx                            ← CE stub → Products.TBMQ
src/content/docs/docs/pe/{slug}.mdx                         ← PE stub → Products.TBMQ_PE
```

URLs: `/docs/{slug}/` (CE), `/docs/pe/{slug}/` (PE). The `mqtt-broker` segment exists only in the
include path (filesystem-only, kept so upstream cherry-picks stay clean) — never in a stub path or a
URL. **The include path is decoupled from the slug** (stub `other/blocked-client` imports
`user-guide/blocked-clients.mdx`), so always find an existing page's include from its stub's import
line.

A stub:

```mdx
---
title: User management
description: Manage users in TBMQ.
---

import PageContent from '@includes/docs/mqtt-broker/{include-path}.mdx'
import { Products } from '~/models/site.models'

<PageContent product={Products.TBMQ}/>
```

Inside the include, the product arrives as `props.product`.

**Edition shapes for a new page:**

| Feature exists in | Create | Sidebar |
|---|---|---|
| Both editions | include + CE stub + PE stub | one entry |
| PE only | include + **PE stub only** | entry gated with `isPE` |
| CE only | include + CE stub only | entry gated with `!isPE` |

A CE stub for a PE-only feature publishes it to CE readers. List the current single-edition pages:

```bash
cd src/content/docs/docs && comm -3 <(find . -name '*.mdx' -not -path './pe/*' | sed 's#^\./##' | sort) <(find pe -name '*.mdx' | sed 's#^pe/##' | sort)
```

(Left column: CE-only. Indented column: PE-only.)

## 2. Product-conditional content

Inside a shared include, wrap PE-only prose in `<ShowFor>` and write **normal Markdown** inside:

```mdx
import ShowFor from '~/components/ShowFor.astro';
import { Products } from '~/models/site.models';

<ShowFor product={props.product} show={[Products.TBMQ_PE]}>
This paragraph, **bold**, `code`, lists, `<Tabs>`/`<Aside>`/`<Code>` — all render only for PE.
</ShowFor>
```

Never use `{props.product === … && (<>…</>)}` with hand-written HTML — a JSX expression disables
Markdown parsing.

**A `<ShowFor>` block cannot add one item to a Markdown list or one row to a table.** The parser
closes the `<ul>`/`<table>` at the block and opens a new one after it, so an appended PE-only bullet
renders as a second list with a gap. Duplicate the **whole** list/table in two blocks (one
`show={[Products.TBMQ]}`, one `show={[Products.TBMQ_PE]}`). If that means three or four
near-identical copies, restructure instead: edition-neutral wording, or a product-aware component
that filters an array whose entries carry `products?: Products[]` (the pattern in
`src/components/TbmqIntegrations.astro`).

**Conditional headings** use `<ConditionalHeading>`, not `##`, so the TOC plugin can add them
conditionally:

```mdx
import ConditionalHeading from '~/components/ConditionalHeading.astro';

<ConditionalHeading level={3} id="configure-license" showFor="mqtt-broker-pe">Configure license</ConditionalHeading>
```

Use `exclude="mqtt-broker-pe"` for a heading CE gets and PE doesn't. The values are the product keys
`mqtt-broker` / `mqtt-broker-pe`, not `ce`/`pe` and not URL prefixes; a wrong value silently drops
the heading from the TOC.

## 3. Internal links, images, version strings

- **Internal links:** always `<DocLink>`, never a bare Markdown link to another doc page. External links stay normal Markdown. `path` is prefix-relative with no leading slash; `bold` defaults to `true` (pass `bold={false}` mid-sentence).
  ```mdx
  import DocLink from '@components/DocLink.astro';
  <DocLink product={props.product} path="architecture">TBMQ architecture</DocLink>
  ```
- **Images:** default to **no screenshots** — describe the exact UI labels and steps instead, and never bulk-remove a page's existing screenshots without asking. When an image is genuinely needed: `<DocImage src="/src/assets/images/docs/mqtt-broker/…" alt="…" />` for one, `ImageGallery` for a grid. Don't reference images that don't exist yet — flag them for a human. **Asset references fail silently:** `ImageGallery` falls back to a CDN URL when a local file is missing, so a bad path passes `astro check` and the build. Grep the built site for `img.thingsboard.io` (the one legitimate hit is `support-ukraine-banner.webp`).
- **Version strings:** never hardcode. Import from `~/data/versions` — `TBMQ_VER`, `TBMQ_PREV_VER`, `TBMQ_PE_VER`, `TBMQ_BRANCH` — and interpolate (e.g. an `export const` template literal rendered with `<Code code={…} lang="bash" />`).

## 4. Frontmatter

There is one docs schema, `baseSchema` (`src/content.config.ts`); its `type` defaults to `base`, so
**no page declares `type:`**. `title` and `description` are required; `description` feeds SEO and
the OG card. Copy the frontmatter shape of a neighbouring page.

## 5. Sidebar

`astro.sidebar.ts` builds the **Guides**, **Installation** and **Reference** groups of both editions
from `tbmqGuideItems(prefix)`, `tbmqInstallItems(prefix)` and `tbmqReferenceItems(prefix)`, called
with `'docs'` (CE) and `'docs/pe'` (PE). One prefix-relative entry
(`` `${prefix}/user-guide/…` ``) serves both editions. Each helper defines
`const isPE = prefix.includes('/pe')`; gate single-edition entries with it.

The **Getting Started** group (including its **Core concepts** subgroup) and **Releases** are
spelled out literally in `tbmqSidebar` and `tbmqPeSidebar`. A page there needs one entry per array,
with the `pe/` slug in the PE copy — or only the PE entry for a PE-only page. Add or trim entries;
don't restructure the file.

## 6. Redirects

Single source of truth: `src/data/redirects.ts`. Pick the export by pattern shape:

| Export | Use for |
|---|---|
| `SINGLE_REDIRECTS` | one-off `/docs/*` page rename or removal |
| `CATCH_ALL_REDIRECTS` | whole-subtree prefix rename (1:1) |
| `DYNAMIC_REDIRECTS` | splat / `:placeholder` patterns |
| `NON_DOCS_REDIRECTS` | anything outside `/docs/*` |

The `/docs/*` arrays are mostly empty, because legacy `/docs/mqtt-broker/…` URLs are mapped by
thingsboard.io's edge redirects — a page renamed or removed *on tbmq.io* still needs an entry here.
A page in both editions needs two entries (`/docs/…` and `/docs/pe/…`).

Workflow: edit `redirects.ts` → `pnpm generate:redirects` (regenerates `public/_redirects` +
`public/redirects.json`) → commit both the data change and the regenerated output.

Never create `.astro` stubs under `src/pages/docs/` that only `Astro.redirect()` (meta-refresh, not
a real 301, and they pollute the sitemap). Never hand-edit `public/_redirects` /
`public/redirects.json` below the generated markers. Keep dynamic rules under 100 (Cloudflare limit).

## 7. Removal checklist

"Delete the page" is not enough:

1. Read each stub's import to find the include (its path may differ from the slug), then remove the include and every stub (CE and/or PE). For a page in both editions, confirm the feature is gone from **both** `tbmq` and `tbmq-pe` before removing the PE side.
2. Remove the sidebar entry (or both literal entries — §5).
3. Add a redirect per removed URL to the closest surviving page (§6), then `pnpm generate:redirects`.
4. Fix inbound **links** across the whole site, not just includes — a dead link anywhere fails `lint:linkcheck`, so these are in scope even in `src/pages/` or `src/components/`:
   ```bash
   grep -rn 'path="<old-slug>' src/content/_includes/
   grep -rnE '/docs/(pe/)?<old-slug>/' src/ --include=*.astro --include=*.ts --include=*.mdx
   ```
   A `DocLink` that is a single list item can't simply be wrapped in `<ShowFor>` (§2) — reword or duplicate the list.
5. Find prose **mentions** of the feature name (`grep -rni '<feature>' src/content src/pages src/components`) and fix the ones in `/docs`. Leave history (`releases.mdx`, blog posts) alone; list mentions outside `/docs` for the user instead of rewording them. Mentions in the generated `config.mdx` pages go away with a generator run (§8).
6. Remove the page's now-orphaned images under `src/assets/images/docs/mqtt-broker/…`, including product-suffix variants (`<name>-tbmq-pe.png`) that `ImageGallery` resolves implicitly — a grep for the path won't find those.
7. Ask before building, then run `pnpm lint:linkcheck` — it catches anything missed.

**Removing a page from one edition only** (the feature leaves CE but stays in PE, or vice versa):
delete only that edition's stub, gate the sidebar entry (`isPE` / `!isPE`), add one redirect for the
removed URL, and gate the edition-specific links and prose in shared includes with `<ShowFor>` —
watching the list-item limitation in §2.

## 8. Verification, CI, generated pages

Confirm the set against `CLAUDE.md` / `CONTRIBUTING.md`.

- `pnpm check` — TypeScript / Astro type checking (CI).
- `pnpm lint:eslint` — ESLint (CI).
- `pnpm lint:slugcheck` — slugs match across languages (CI).
- `pnpm lint:steps` — validates `<Steps>` usage.
- `pnpm lint:redirects` — detects redirect chains.
- **Build-dependent — ask first:** `pnpm build:fast` (production build without OG images), `pnpm lint:linkcheck` (builds, then validates all links; **must pass** before merge — run it after adding, renaming or removing pages, changing redirects, or editing internal links; `lint:linkcheck:nobuild` reuses a build from this session), `pnpm lint:toc` (asserts `_includes` headings reached the rendered TOC; needs `dist/`).
- `pnpm format` — Prettier, but **never repo-wide**: the repo isn't Prettier-clean, so format only the files you touched.

**Generated pages — never hand-edit:** `src/content/docs/docs/{,pe/}installation/config.mdx` and
`…/installation/ie-config.mdx`, produced by
`python3 scripts/generate_config_pages.py <tbmq|tbmq-pe> <branch>` (alias: `pnpm generate:config <tbmq|tbmq-pe> <branch>`). It reads the YAML from GitHub
via `gh api` (needs an authenticated `gh`; `tbmq-pe` is private), and both arguments are required.
`<branch>` is a **code-repo** branch, not the docs `--branch`; use the release line you verified
against (`main` / `license`) unless the user names another — the script's docstring examples use
older branch names. A run also sweeps in unrelated YAML drift since the last run; say so when you
flag it. For work not yet merged into the release line, the key isn't on `main` / `license` yet:
flag the run as a follow-up for after the merge rather than pointing the generator at a feature
branch.

**Dev-server caveat:** adding or renaming a heading in an include doesn't refresh that page's TOC
until the dev server restarts.

## 9. Style

- **Indentation:** spaces for MDX / Markdown / YAML / JSON; tabs only in code files.
- **Prettier:** printWidth 120, single quotes, `trailingComma: es5`.
- **Never start an MDX line with `>`.** A JSX tag whose closing bracket sits on its own line reads as a Markdown blockquote and fails the build with `mdx-jsx:unexpected-character`. Keep the `>` on the last attribute's line.
- Match the voice and structure of neighbouring pages — TBMQ docs are direct and example-led. Reuse the components already used on similar pages.
