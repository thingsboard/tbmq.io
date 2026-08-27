# Contributing to TBMQ Docs

Thanks for helping improve the TBMQ documentation. This repo holds the source for [tbmq.io](https://tbmq.io/) — documentation content, the marketing pages, the site code that renders them, and redirects. Bugs and features in the TBMQ broker itself live in the [`thingsboard/tbmq`](https://github.com/thingsboard/tbmq) repo.

## Prerequisites

- Node.js — any recent LTS release.
- [pnpm](https://pnpm.io/installation) — the package manager this repo uses.
- Python 3 — only needed for the configuration-page regeneration task in [Common tasks](#common-tasks).

## Local development

1. Fork this repo on GitHub.
2. Clone your fork:
   ```bash
   git clone git@github.com:<your-username>/tbmq.io.git
   cd tbmq.io
   ```
3. Install dependencies and start the dev server:
   ```bash
   pnpm install
   pnpm dev
   ```
4. Open <http://localhost:4321/docs/> in your browser.

`pnpm dev` rebuilds incrementally and is the normal authoring loop. Before opening a PR, run `pnpm build:fast` for a full production build. It skips OG image generation for speed; run the full `pnpm build` when you need to check the generated OG cards.

## Before you open a PR

GitHub Actions runs three checks. All must pass for the PR to be merged. Run them locally first:

- `pnpm check` — TypeScript and Astro type checking.
- `pnpm lint:eslint` — ESLint.
- `pnpm lint:slugcheck` — verifies slugs match across locales.

Link validation runs in a separate pipeline (it needs a full build) and must also pass before merge. Run it locally when you add, rename, or remove pages, change redirects, or edit internal links:

- `pnpm lint:linkcheck` — full link validation (slow; runs a build first).
- `pnpm lint:linkcheck:nobuild` — same check against a build you already produced.

Other commands worth knowing:

- `pnpm build:fast` — production build (catches broken imports, missing assets, schema errors).
- `pnpm format` — Prettier formatting.

## Content authoring basics

A 30-second orientation. For the full architecture (product system, schemas, redirects, OG cards), see [`CLAUDE.md`](./CLAUDE.md).

**Where pages live.** Documentation pages are MDX files under `src/content/docs/docs/mqtt-broker/`. The site is English-only, so there are no per-language content directories. Marketing and landing pages live under `src/pages/`.

**The CE / PE three-tier pattern.** Pages that exist for both Community Edition (CE) and Professional Edition (PE) do not duplicate content. The actual content lives in a shared MDX file under `src/content/_includes/docs/mqtt-broker/{path}/{page}.mdx`. Two thin stub pages import it. The CE stub at `src/content/docs/docs/mqtt-broker/{path}/{page}.mdx` passes `Products.TBMQ`; the PE stub at `src/content/docs/docs/mqtt-broker/pe/{path}/{page}.mdx` passes `Products.TBMQ_PE`:

```mdx
---
title: My Page
---
import PageContent from '@includes/docs/mqtt-broker/path/page.mdx';
import { Products } from '~/models/site.models';

<PageContent product={Products.TBMQ} />
```

**Internal links.** Use the `<DocLink>` component, never bare Markdown links to other doc pages. Bare links break when product prefixes change.

**Version strings.** Never hardcode TBMQ version numbers in Docker image tags, download URLs, or code samples. Import constants from `~/data/versions` (`TBMQ_VER`, `TBMQ_PE_VER`, `TBMQ_BRANCH`).

**Sidebar.** When you add a new page, register it in `astro.sidebar.ts`. The shared helpers `tbmqGuideItems(prefix)`, `tbmqInstallItems(prefix)`, and `tbmqReferenceItems(prefix)` cover both editions — add the entry once and both CE and PE pick it up.

## Common tasks

### Fix a typo or broken link

1. Edit the affected file.
2. Run `pnpm lint:linkcheck:nobuild` if you touched a link (skip for pure typos).
3. Commit and open a PR.

### Add a new documentation page

1. Create the shared include at `src/content/_includes/docs/mqtt-broker/{path}/{page}.mdx`.
2. Create the CE stub at `src/content/docs/docs/mqtt-broker/{path}/{page}.mdx` that imports the include with `Products.TBMQ`.
3. Create the PE stub at `src/content/docs/docs/mqtt-broker/pe/{path}/{page}.mdx` that imports the include with `Products.TBMQ_PE`.
4. Register the page's slug in `astro.sidebar.ts` (typically inside the matching `tbmqGuideItems`, `tbmqInstallItems`, or `tbmqReferenceItems` helper).
5. Run `pnpm dev` and verify the page renders for both editions.

### Add a redirect

1. Edit `src/data/redirects.ts` and pick the export that matches your pattern:
   - `SINGLE_REDIRECTS` — one-off page rename under `/docs/*`.
   - `CATCH_ALL_REDIRECTS` — prefix rename (whole subtree renamed 1:1).
   - `DYNAMIC_REDIRECTS` — splat or `:placeholder` patterns.
   - `NON_DOCS_REDIRECTS` — anything outside `/docs/*`.
2. Run `pnpm generate:redirects` — this regenerates `public/_redirects` and `public/redirects.json`.
3. Commit both the data change and the regenerated output.

Do not hand-edit `public/_redirects` or `public/redirects.json` directly — they are rewritten by the generator.

### Regenerate configuration reference pages

When TBMQ's `*.yml` config files change, regenerate the configuration reference MDX pages with `scripts/generate_config_pages.py`. The script fetches the config files directly from GitHub via the [`gh` CLI](https://cli.github.com/) — no local checkout needed. Run `gh auth login` once (required for the private `tbmq-pe` repo), then from this repo's root:

```bash
python3 scripts/generate_config_pages.py <repo_type> <branch>
```

`<repo_type>` is `tbmq` (reads [`thingsboard/tbmq`](https://github.com/thingsboard/tbmq)) or `tbmq-pe` (reads `thingsboard/tbmq-pe`). `<branch>` is the branch to read the config files from. For example, to regenerate the CE pages from `main`:

```bash
python3 scripts/generate_config_pages.py tbmq main
```

Commit the regenerated files — `src/content/docs/docs/mqtt-broker/installation/config.mdx` and `ie-config.mdx` for CE, the same paths under `mqtt-broker/pe/` for PE.

## Opening the PR

- Branch naming is loose; descriptive is enough (`fix/mqtt-quickstart-typo`, `add/kubernetes-installation-page`).
- Use imperative-mood commit messages. Keep the subject brief; add a body if the motivation isn't obvious from the diff.
- The PR title should describe the change. The body should mention the affected pages and include screenshots if there's a visual change.
- Verify your change in a rendered context before requesting review — `pnpm dev` while authoring, or `pnpm build:fast && pnpm preview` for the production output.
- The CI checks must pass before merge.

## Getting help

- Found a documentation bug, broken link, or unclear page? [Open an issue](https://github.com/thingsboard/tbmq/issues) in the TBMQ repo.
- Read the live docs at [tbmq.io/docs/](https://tbmq.io/docs/) to see what's already published.
- PRs are reviewed by the TBMQ team on a best-effort basis.
