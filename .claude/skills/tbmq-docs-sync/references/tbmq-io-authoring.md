# tbmq.io authoring cheat-sheet

Concrete conventions for editing the TBMQ documentation site (this repo — Astro + Starlight,
MDX). This is a distilled pointer — the repo's own `CLAUDE.md` is the living authority. If
anything here disagrees with it, it wins; read it at the start of a docs task.

`CONTRIBUTING.md` is a contributor-facing summary and is **stale on the stub paths** — it still
documents `src/content/docs/docs/mqtt-broker/{path}` and `.../mqtt-broker/pe/{path}`, which no
longer exist. Trust `CLAUDE.md` and the actual tree over it.

## Table of contents
1. Content layout & the CE/PE include-stub pattern
2. Product-conditional content (PE-only bits)
3. Internal links, images, version strings
4. Frontmatter & schemas
5. Sidebar (navigation)
6. Redirects (renames & removals)
7. Removal checklist
8. Verification & CI
9. Style

---

## 1. Content layout & the CE/PE include-stub pattern

Common content is written **once** in a shared include under `_includes/docs/mqtt-broker/`; two
thin stub pages (CE and PE) import it and pass their product. This is how CE and PE stay in
sync without duplication.

```
src/content/_includes/docs/mqtt-broker/{path}/{page}.mdx   ← actual content (shared)
src/content/docs/docs/{path}/{page}.mdx                     ← CE stub  → Products.TBMQ
src/content/docs/docs/pe/{path}/{page}.mdx                  ← PE stub  → Products.TBMQ_PE
```

**URL:** `/docs/{page-slug}/` (CE), `/docs/pe/{page-slug}/` (PE).

The `mqtt-broker` segment lives **only** in the include path — it is a filesystem-only location,
never routed to a URL, and its name is kept so upstream cherry-picks stay clean. Never put it in a
stub path or a URL.

A stub is minimal — it imports the include and renders it with the product:

```mdx
---
title: User management
description: Manage users in TBMQ.
---

import PageContent from '@includes/docs/mqtt-broker/{path}/{page}.mdx'
import { Products } from '~/models/site.models'

<PageContent product={Products.TBMQ}/>      {/* PE stub uses Products.TBMQ_PE */}
```

Both stubs import the **same** include path (the one with `mqtt-broker`); only the `Products` value
and the stub's own location differ.

Note the import alias `@includes/docs/...` for the shared file. Inside the include, the
product arrives as `props.product`.

**To add a new page:** create the include, then the CE stub (`Products.TBMQ`), then the PE
stub (`Products.TBMQ_PE`), then register the slug in `astro.sidebar.ts`. Verify it renders
for both products.

---

## 2. Product-conditional content (PE-only bits)

Inside a shared include, wrap PE-only prose in `<ShowFor>` and write **normal Markdown**
inside it:

```mdx
import ShowFor from '~/components/ShowFor.astro';
import { Products } from '~/models/site.models';

<ShowFor product={props.product} show={[Products.TBMQ_PE]}>
This paragraph, **bold**, `code`, lists, `<Tabs>`/`<Aside>`/`<Code>` — all render only for PE.
</ShowFor>
```

Do **not** use `{props.product === … && (<>…</>)}` with hand-written `<p>`/`<ul>`/`<code>`
HTML — a JSX `{…}` expression disables Markdown parsing and forces ugly raw HTML. `<ShowFor>`
keeps Markdown working.

**A `<ShowFor>` block cannot *add* one item to a Markdown list or one row to a table.** The parser
closes the `<ul>`/`<table>` at the JSX block and opens a new one after it, so an appended PE-only
bullet renders as a second list with a visible gap. Duplicate the **whole** list/table in two blocks
(one `show={[Products.TBMQ]}`, one `show={[Products.TBMQ_PE]}`) instead. If that would mean three or
four near-identical copies, prefer restructuring: an edition-neutral wording, or a product-aware
component that filters a data array whose entries carry `products?: Products[]` (the pattern in
`src/components/TbmqIntegrations.astro`).

**Conditional headings** are the one exception — a heading inside a conditional must use
`<ConditionalHeading>` (not `##`) so the TOC plugin can add it conditionally:

```mdx
import ConditionalHeading from '~/components/ConditionalHeading.astro';

<ConditionalHeading level={3} id="configure-license" showFor="mqtt-broker-pe">Configure license</ConditionalHeading>
```

Use `exclude="mqtt-broker-pe"` for the mirror case (a heading CE gets and PE does not). The values
are the TBMQ product keys `mqtt-broker` / `mqtt-broker-pe`, not the URL prefixes.

---

## 3. Internal links, images, version strings

- **Internal links:** always `<DocLink>`, never a bare Markdown link to another doc page
  (bare links break under product-prefix changes). External links stay normal Markdown.
  ```mdx
  import DocLink from '@components/DocLink.astro';
  <DocLink product={props.product} path="architecture">TBMQ architecture</DocLink>
  ```
- **Images:** `import DocImage from '~/components/DocImage.astro'`, then
  `<DocImage src="/src/assets/images/docs/mqtt-broker/…" alt="…" />` for a single image;
  `ImageGallery` for grids with lightbox (there is no `MultiProductImageGallery` in this repo).
  New UI needs new image files — flag them for a human; don't invent paths to nonexistent assets.
  **Asset references fail silently:** `ImageGallery` falls back to a CDN URL and
  `InstallationCardGrid` renders nothing when a local file is missing, so a bad path passes both
  `astro check` and the build. Default to **no screenshots** — describe the exact UI labels and
  steps instead — and never bulk-remove a page's existing screenshots without asking.
- **Version strings:** never hardcode. Import from `~/data/versions` — `TBMQ_VER`,
  `TBMQ_PE_VER`, `TBMQ_BRANCH` — and interpolate (e.g. in a template literal for a code block).

---

## 4. Frontmatter & schemas

Content uses type-safe Zod schemas (`src/content.config.ts`). There is exactly **one** docs schema,
`baseSchema`, whose `type` field is a `z.literal('base')` with a default — so **no page declares
`type:` in its frontmatter, and you must not add one**. The upstream `deploy` / `backend` / `cms` /
`media` / `integration` / `migration` / `tutorial` / `recipe` types were removed with the
multi-product scaffolding; don't reintroduce them.

`title` and `description` are the required fields; `description` feeds SEO and the OG card. Copy the
frontmatter shape of a neighboring page in the same folder rather than guessing fields.

---

## 5. Sidebar (navigation)

New or removed pages must be reflected in `astro.sidebar.ts`. Three prefix-parameterized
helpers — `tbmqGuideItems(prefix)`, `tbmqInstallItems(prefix)`, `tbmqReferenceItems(prefix)` —
back the **Guides**, **Installation**, and **Reference** groups of both editions (`tbmqSidebar` calls
them with `'docs'`, `tbmqPeSidebar` with `'docs/pe'`). A slug added to a helper is therefore picked
up by CE and PE at once — write it prefix-relative, e.g. `` `${prefix}/user-guide/…` ``. A helper
also derives `const isPE = prefix.includes('/pe')`; use it to gate an entry that only one edition
has, rather than adding the slug unconditionally.

The **Getting Started** and **Releases** groups are spelled out literally in `tbmqSidebar` and
`tbmqPeSidebar` instead — a page in those needs its entry added **twice**, once per array, with
the `pe/` slug in the PE copy. Add or trim the single entry; don't restructure the file.

---

## 6. Redirects (renames & removals)

Single source of truth: `src/data/redirects.ts`. All four arrays are **empty at HEAD** — legacy
`/docs/mqtt-broker/…` URLs are already mapped one-hop by thingsboard.io's edge redirects, so there
are no in-repo examples to copy. A page you rename or remove *on tbmq.io* still needs an entry.
Pick the export by pattern shape:

| Export | Use for |
|---|---|
| `SINGLE_REDIRECTS` | one-off `/docs/*` page rename |
| `CATCH_ALL_REDIRECTS` | whole-subtree prefix rename (1:1) |
| `DYNAMIC_REDIRECTS` | splat / `:placeholder` patterns |
| `NON_DOCS_REDIRECTS` | anything outside `/docs/*` |

Workflow: edit `redirects.ts` → run `pnpm generate:redirects` (regenerates
`public/_redirects` + `public/redirects.json`) → commit **both** the data change and the
regenerated output.

**Hard rules:** do NOT create `.astro` stub files under `src/pages/docs/` that only
`Astro.redirect()` (they emit meta-refresh, not real 301s, and pollute the sitemap). Do NOT
hand-edit `public/_redirects` / `public/redirects.json` below the generated markers. Keep
dynamic rules under 100 (Cloudflare limit).

---

## 7. Removal checklist

When a feature is removed, "delete the page" is not enough:
1. Remove the include + both stubs (CE and PE).
2. Remove its entry from `astro.sidebar.ts`.
3. Add a redirect in `src/data/redirects.ts` so the old URL doesn't 404 (point to the closest
   surviving page), then `pnpm generate:redirects`.
4. Find and fix inbound `<DocLink>`s from other pages (grep `src/content/_includes/` for the old
   `path=` value).
5. Remove now-orphaned images under `src/assets/images/docs/mqtt-broker/…`.
6. Run `pnpm lint:linkcheck` — it catches anything missed.

---

## 8. Verification & CI

Confirm the current set against the repo's `CLAUDE.md` / `CONTRIBUTING.md` (these commands are
what they document today). **Build policy: always ask before running any build** — "Run
`pnpm build:fast` to verify, or skip?"

- `pnpm check` — TypeScript / Astro type checking (CI).
- `pnpm lint:eslint` — ESLint (CI).
- `pnpm lint:slugcheck` — slugs match across languages (CI).
- `pnpm build:fast` — production build, skips OG generation; use for verification.
- `pnpm lint:linkcheck` — full link validation (separate pipeline; slow, runs a build).
  **Must pass** — run it when adding, renaming, or removing pages, changing redirects, or
  editing internal links. `pnpm lint:linkcheck:nobuild` if a build already ran this session.
- `pnpm lint:toc` — asserts `_includes` headings (and a PE-only `<ConditionalHeading>`) actually
  reached the rendered TOC. No other check catches a TOC that vanished. Needs a built `dist/`.
- `pnpm lint:steps` — validates `<Steps>` usage.
- `pnpm lint:redirects` — detects redirect chains.
- `pnpm format` — Prettier, but **never repo-wide**: this repo is not Prettier-clean at HEAD, so
  format only the files you touched.

**Generated pages — do not hand-edit.** `src/content/docs/docs/{,pe/}installation/config.mdx` and
`.../installation/ie-config.mdx` are produced by `scripts/generate_config_pages.py <repo_type>
<branch>` (`repo_type` is `tbmq` or `tbmq-pe`; it fetches the YAML from GitHub via the `gh` CLI, and
both arguments are required). Edit the prose pages that explain a parameter instead, and flag a
generator run separately.

**Dev-server caveat.** Adding or renaming a heading in an `_includes` file does not refresh that
page's TOC until the dev server restarts — the stub's compiled module is not invalidated. Restart
before trusting any anchor/TOC check in `pnpm dev`.

---

## 9. Style

- **Indentation:** spaces for MDX / Markdown / YAML / JSON (tabs only in code files).
- **Prettier:** printWidth 120, single quotes, `trailingComma: es5`.
- **Sätteri authoring rule:** never start a line with `>`. A JSX opening tag whose closing bracket
  sits at the start of its own line reads as a Markdown blockquote to the Rust parser and fails the
  build with `mdx-jsx:unexpected-character`. Keep the `>` on the last attribute's line.
- Match the voice and structure of neighboring pages — TBMQ docs are direct and
  example-led. Reuse the components already used on similar pages rather than introducing new
  patterns.
