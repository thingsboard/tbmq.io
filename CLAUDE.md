# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **TBMQ website** — the documentation and marketing site for **TBMQ**, the open-source MQTT broker by ThingsBoard. It is built with **Astro + Starlight**.

**This repo is a downstream deployment derived from the full ThingsBoard site.** Only TBMQ content ships here (the TBMQ docs tree plus TBMQ marketing pages). This repo does **not** track full upstream merges — upstream changes are **cherry-picked** in when needed. To keep those cherry-picks clean, some multi-product scaffolding inherited from upstream is still **kept intact on purpose**: the `Products` enum, `versions.ts`, the redirect tables, and the content schemas. `astro.sidebar.ts` is the exception — it has been **trimmed to the TBMQ sidebars only** (the unused upstream product sidebars were removed). When editing the remaining shared files, prefer trimming/deploying content over restructuring them.

The full upstream ThingsBoard site (all products/editions) is available as an additional working directory at `~/projects/thingsboard.io` for reference and cherry-picking.

## Commands

```bash
# Install dependencies (requires pnpm)
pnpm install

# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm build:fast       # Fast build (skips OG image generation) — use this for verification
pnpm preview          # Preview production build

# Quality checks
pnpm check            # TypeScript/Astro type checking
pnpm lint:eslint      # ESLint
pnpm lint:linkcheck   # Link validation (runs a build first)
pnpm lint:linkcheck:nobuild  # Link validation (skip build)
pnpm lint:slugcheck   # Validate slugs match across languages
pnpm format           # Format with Prettier
pnpm generate:redirects      # Regenerate public/_redirects + public/redirects.json
```

**Build policy:** Before running any build, always ask the user: "Run `pnpm build:fast` to verify, or skip?"

## Architecture

### Content System

TBMQ documentation lives in `src/content/docs/docs/` as `.mdx` files with YAML frontmatter:

- `src/content/docs/docs/` → TBMQ Community Edition pages
- `src/content/docs/docs/pe/` → TBMQ Professional Edition pages

Content uses Astro's Content Collections with type-safe Zod schemas defined in `src/content.config.ts`.

**Schema types** determine frontmatter shape: `base`, `deploy`, `backend`, `cms`, `media`, `integration`, `migration`, `tutorial`, `recipe`. The `type` frontmatter field selects the schema. (The schema set is inherited from upstream; TBMQ pages are almost all `base`.)

**Sidebar** is configured in `astro.sidebar.ts`. This file has been trimmed to the TBMQ sidebars only — `tbmqSidebar` / `tbmqPeSidebar` and their tab-links (the unused upstream product sidebars were removed). The site consumes the combined `sidebar` export (filtered per edition by route middleware) plus `sidebarTabLinksByPrefix`.

### i18n

- **English-only** at present. `astro.config.ts` sets `defaultLocale: 'root'` (English served at the root, no `/en/` prefix).
- Ukrainian (`uk`) scaffolding exists but is **commented out / disabled** in `astro.config.ts` ("no translations yet").
- UI-string translations live in `src/content/i18n/` (`en.json`, `uk.json`); `src/content/i18n/i18n.ts` sets `DEFAULT_LOCALE = 'en'`.
- Translation status is tracked by Lunaria (`lunaria.config.ts`, `uk` configured there).

There is **no** `config/locales.ts` and **no** per-language content directories in this repo — docs are authored once under `src/content/docs/docs/`.

### Path Alias

`~/*` maps to `./src/*` (configured in tsconfig.json).

### Starlight Customization

Custom component overrides live in `src/components/starlight/` — these replace default Starlight components (Hero, Sidebar, Footer, Search, Header, etc.). They are registered in the `starlight({ components: {...} })` block of `astro.config.ts`.

Landing/marketing components live under `src/components/` (notably `Landing/`, `MqttBroker/`, `Company/`, `Installations/`).

### Available Components

Props and usage live in each component file under `src/components/`. Commonly used in docs:

- **ImageGallery** — responsive image grid with lightbox, product suffix resolution, dark theme variants
- **MultiProductImageGallery** — auto product-suffix wrapper around ImageGallery
- **DocImage** — single optimized image with width/alignment options
- **Banner** — product/info banners (peFeature, ce, pe, cloud variants)
- **Badge** — accent badge for sidebar and page titles
- **YouTubeVideo** — responsive 16:9 YouTube embed
- **ConditionalHeading** — TOC-aware heading for use inside JSX conditionals in `_includes`
- **InstallationCardGrid** — installation option card grid
- **RuleNodeCardGrid** — rule node category card grid
- **DocLink** — product-aware internal links (always use instead of bare markdown links)
- **Code blocks** — `maxLines`, `collapsible`, `wrap`, `download='file.ext'` meta options; `<Code>` component for dynamic code

### Product System

All product identifiers live in `src/models/site.models.ts` as the `Products` enum. The enum and its `productDocsPrefix` map are **kept full (all upstream products) for merge compatibility**, but only the TBMQ variants ship content here:

| Enum value | URL prefix | Content directory |
|------------|------------|-------------------|
| `TBMQ` | `''` (empty) | `src/content/docs/docs/` |
| `TBMQ_PE` | `pe/` | `src/content/docs/docs/pe/` |

Other enum values (`CE`, `PE`, `PAAS`, `EDGE`, `GW`, `LICENSE`, `TRENDZ`, `MOBILE`, …) exist in the model but have **no content** in this repo. Don't add non-TBMQ product content — this is a TBMQ-only site.

**URL pattern:** `/docs/[product-prefix][page-slug]/` → e.g. `/docs/getting-started/` (CE), `/docs/pe/...` (PE).

### Shared Content via _includes

Documentation pages are thin wrappers that import a shared **include file** and pass the current `product` as a prop. This avoids duplicating content between CE and PE.

```
src/content/_includes/docs/mqtt-broker/{path}/{page}.mdx   ← actual content (shared)
src/content/docs/docs/{path}/{page}.mdx                     ← CE stub (passes Products.TBMQ)
src/content/docs/docs/pe/{path}/{page}.mdx                  ← PE stub (passes Products.TBMQ_PE)
```

The include path keeps the `mqtt-broker` segment on purpose — it's a filesystem-only location (never routed to a URL), and leaving its name alone keeps upstream cherry-picks clean since the full ThingsBoard site's include tree uses the same path.

**Product-conditional content:** wrap it in `<ShowFor product={props.product} show={[Products.TBMQ_PE]}>…</ShowFor>` and write **normal Markdown** inside (`**bold**`, `-`/`1.` lists, `` `code` ``, `<Tabs>`/`<Aside>`/`<Code>` components). Do **not** use `{props.product === … && (<>…</>)}` with hand-written `<p>`/`<ul>`/`<li>`/`<code>` HTML — a JSX `{…}` expression disables Markdown parsing, forcing ugly raw HTML; `<ShowFor>` does not. The one exception: headings inside still use `<ConditionalHeading … showFor="…">` (not `##`), because the TOC plugin needs that metadata to add them conditionally.

### Screenshots in Docs

**Default to no screenshots.** A screenshot has to be regenerated every time the UI changes, which is cumbersome and easy to get wrong — a stale screenshot is worse than none. Instead, **describe precisely what the user sees and does**: the exact page, button, field, tab, and toggle labels, in order, using `<Steps>` with **bold** for UI labels and `` `code` `` for values to type. A reader must be able to complete the task from the text alone.

Add a screenshot only when it is genuinely necessary (for example, the UI itself is what needs explaining and words cannot carry it). When one is necessary:

- **No annotations drawn on the image** — no yellow arrows, no numbered callout boxes, no highlight frames. Older pages have these; do not copy the pattern.
- The step text still has to be complete on its own; the image only supports it.

**Never bulk-remove existing screenshots from a page you happen to be editing.** Many pages still carry the older annotated galleries. If a page's screenshots look obsolete, say so and ask — removal is the user's call, made page by page.

### Version Constants

`src/data/versions.ts` — centralized product version strings. **Never hardcode version strings** in Docker image tags, download URLs, or code blocks. Import from `~/data/versions`.

For TBMQ, the relevant constants are `TBMQ_VER`, `TBMQ_PE_VER`, and `TBMQ_BRANCH`. The file also retains the other products' constants (`CE_FULL_VER`, `PE_FULL_VER`, `TRENDZ_VER`, `EDGE_VER`, …) for upstream compatibility.

### Custom Plugins

Registered in `astro.config.ts` (`rehypePlugins`):

- `config/plugins/rehype-mdx-include-headings.ts` — extracts headings from `_includes` MDX files and injects them into the page TOC; supports `<ConditionalHeading>` for product-conditional headings
- `config/plugins/rehype-tasklist-enhancer.ts` — enhanced task lists
- `config/plugins/expressive-code-max-lines.mjs` — powers the `maxLines`/`collapsible` code-block meta options

`llms.txt` is generated by the route endpoints `src/pages/llms.txt.ts` and `src/pages/llms-small.txt.ts` (skippable in builds via `SKIP_LLMS=true`).

### Pages vs Content

- `src/content/docs/` — documentation pages rendered by Starlight (the TBMQ docs tree)
- `src/pages/` — special routes and TBMQ marketing/landing pages: root `index.astro`, `products/`, `pricing/`, `installations/`, `partners/`, `company/`, `community/`, `contact-us`, `blog/`, `open-graph/` (OG generation), `404.astro`, `llms.txt`, plus use-case landing pages (`energy-management`, `smart-farming-demo`, `monitoring-dashboard`, `asset-management`, `device-management`, `iot-data-visualization`, `google-iot-core-alternative`, `ce-vs-pe-diff`)

### Typography & Design System

All non-doc pages (landing, marketing, standalone pages) share a unified typography system defined as SCSS mixins in `src/styles/_variables.scss`.

Key rules: **Never hardcode font values** — use the mixins. **Never use compile-time SCSS color variables** for theme-dependent colors — use CSS custom properties (`var(--color-*)`).

## Redirects

**Single source of truth:** `src/data/redirects.ts`. Four exports, chosen by pattern shape:

| Export | Use for | Example |
|---|---|---|
| `SINGLE_REDIRECTS` | one-off `/docs/*` page rename | `{ oldPath: '...', target: '/docs/...' }` |
| `CATCH_ALL_REDIRECTS` | `/docs/*` prefix rename (whole tree renamed 1:1) | prefix → `:splat` |
| `DYNAMIC_REDIRECTS` | splat / `:placeholder` patterns that aren't a simple prefix rename | `/blog/category/:category/page/* → /blog/?category=:category` |
| `NON_DOCS_REDIRECTS` | everything outside `/docs/*` (marketing, external targets) | `/iot-use-cases/` → `/use-cases/` |

**Workflow to add a redirect:**

1. Edit `src/data/redirects.ts` (pick the export that matches the pattern).
2. Run `pnpm generate:redirects` — regenerates `public/_redirects` and `public/redirects.json`.
3. Commit both the data change and the regenerated output.

**Two places, two purposes:**

- `public/_redirects` — served by Cloudflare Pages. Gives **real 301s at the edge**. A matching rule here always wins, even if a static HTML file exists at the same path.
- `astro.redirects.ts` → `redirects:` — used by Astro in `pnpm dev` / `pnpm preview` so old URLs resolve locally instead of 404-ing. It spreads `public/redirects.json` (all `/docs/*`) + `NON_DOCS_REDIRECTS` + dev-fallback redirects, so a single run of `pnpm generate:redirects` keeps dev and prod in sync.

**Hard rules:**

- **Do NOT create new `.astro` stub files** under `src/pages/docs/` that only call `Astro.redirect()`. Put the entry in `src/data/redirects.ts` instead (page-based stubs only emit meta-refresh, not real 301s, and pollute the sitemap).
- **Do NOT hand-edit `public/_redirects` or `public/redirects.json`** below the auto-generated markers — they're rewritten by `pnpm generate:redirects`.
- **Keep dynamic rules (splat / `:placeholder`) under 100.** Cloudflare Pages limit is 2,000 static + 100 dynamic.

## OG image generation

Per-page OG cards (1200×630 PNG) are generated at build time by Satori + Resvg. Each content collection has its own static endpoint under `src/pages/open-graph/`. One JSX template (`_shared/Card.tsx`) is varied only by an "eyebrow" line and an optional bottom-left meta line.

**Files:**
- `src/pages/open-graph/_shared/Card.tsx` — template
- `src/pages/open-graph/_shared/render.ts` — Satori → Resvg pipeline + content-hash cache
- `src/pages/open-graph/{collection}/[…].png.ts` — three static endpoints: **docs, blog, pages**
- `src/util/ogContext.ts` — eyebrow / label helpers + `MARKETING_ALLOWLIST`
- `src/util/getOgImageUrl.ts` — pathname → OG PNG URL aggregator

**Key facts:**
- Cache lives at `node_modules/.og-cache/` (gitignored). Bump `TEMPLATE_VERSION` in `render.ts` to invalidate.
- `SKIP_OG=true` (used by `pnpm build:fast`) makes `renderCard` return the global fallback instead of running Satori.
- Pages outside `MARKETING_ALLOWLIST` (or otherwise unmapped) fall back to the global OG image via `SeoMeta.astro`.
- **Astro dev quirk:** `trailingSlash: 'always'` makes the dev server 404 dynamic-route URLs that end in `.png`. `og:image` gets a trailing `/` appended only in `import.meta.env.DEV` so dev links resolve while production HTML keeps the clean `.png` URL Cloudflare serves directly.

**To add a new marketing landing to OG generation:** add its pathname to `MARKETING_ALLOWLIST` in `src/util/ogContext.ts` and rebuild.

## Releasing a New TBMQ Version

- `src/data/versions.ts` — bump `TBMQ_VER`, `TBMQ_PE_VER`, and `TBMQ_BRANCH`.
- `src/models/releases-table.ts` and `src/models/upgrade-instructions.ts` — release/upgrade tables if the release adds rows.

## Code Style

- Tabs for indentation in code files; spaces for JSON, Markdown, MDX, YAML, TOML
- Prettier with `prettier-plugin-astro`, printWidth 100, single quotes, trailing commas
- ESLint flat config with TypeScript and Astro plugins

## CI Checks

GitHub Actions runs: `astro check`, `eslint`, `slugcheck`.

`lint:linkcheck` runs in a separate CI pipeline (not GitHub Actions) because it needs a full build. It must also pass before a PR can merge — so run it locally before requesting review, especially when adding, renaming, or removing pages, changing redirects, or editing internal links. Use `pnpm lint:linkcheck` for a clean check, or `pnpm lint:linkcheck:nobuild` if you already produced a build in this session.
