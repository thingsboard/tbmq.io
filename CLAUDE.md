# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **TBMQ website** — the documentation and marketing site for **TBMQ**, the open-source MQTT broker by ThingsBoard. It is built with **Astro + Starlight**.

**This repo is a downstream deployment derived from the full ThingsBoard site.** Only TBMQ content ships here (the TBMQ docs tree plus TBMQ marketing pages). This repo does **not** track full upstream merges — upstream changes are **cherry-picked** in when needed.

The multi-product scaffolding inherited from upstream has been removed: the `Products` enum, `versions.ts`, the content schema types and `astro.sidebar.ts` are all TBMQ-only now, and the non-TBMQ components, assets and data files are deleted. One thing still lingers:

- Ukrainian locale scaffolding — inert but wired into live code (`src/util/path-utils.ts`, `src/routeData.ts`, `src/util/canonical.ts`, `src/util/getPageCategory.ts`, `translations: { uk }` in `astro.sidebar.ts`). It is the on-ramp if `uk` is ever enabled; leave it alone rather than half-removing it.

The full upstream ThingsBoard site (all products/editions) is available as an additional working directory at `~/projects/thingsboard.io` for reference and cherry-picking. If something removed here is ever needed again, take the current upstream version from there rather than reviving a stale copy out of this repo's history.

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
pnpm lint:steps       # Validate <Steps> usage in docs
pnpm lint:redirects   # Detect redirect chains
pnpm format           # Format with Prettier
pnpm generate:redirects      # Regenerate public/_redirects + public/redirects.json
pnpm generate:nav-sprite     # Rebuild public/nav-sprite.svg + its manifest
pnpm update:stars            # Refresh the GitHub star count in src/data/github-stars.json
```

`generate:nav-sprite` already runs as part of `build` and `build:fast`. Run it by hand after adding or editing an icon in `src/assets/images/landings/nav/` — otherwise `NavIcon` finds no manifest entry and renders nothing (it warns in the dev/build log).

**Build policy:** Before running any build, always ask the user: "Run `pnpm build:fast` to verify, or skip?"

**Comparing two builds** (the reliable way to prove a deletion or refactor changed nothing): two builds of the same tree are byte-identical (tab ids are counted per page since Starlight 0.42), so the one difference that is *not* your change is sitemap `<lastmod>` — it comes from git commit dates and moves as soon as you commit. Anything else that differs is a real output change.

## Architecture

### Content System

TBMQ documentation lives in `src/content/docs/docs/` as `.mdx` files with YAML frontmatter:

- `src/content/docs/docs/` → TBMQ Community Edition pages
- `src/content/docs/docs/pe/` → TBMQ Professional Edition pages
- `src/content/docs/docs/lite/` → TBMQ Lite pages. These are standalone `.mdx` files with their own content, not stubs over a shared `_includes` file: nothing else renders them.

Content uses Astro's Content Collections with type-safe Zod schemas defined in `src/content.config.ts`.

**Schema:** there is one docs schema, `baseSchema` (`src/content.config.ts`), and its `type` field is `z.literal('base')` with a default — no page needs to declare it. The upstream `deploy`/`backend`/`cms`/`media`/`integration`/`migration`/`tutorial`/`recipe` types and the component trees they switched on are gone; don't reintroduce a `type:` in frontmatter.

**Sidebar** is configured in `astro.sidebar.ts`. This file has been trimmed to the TBMQ sidebars only — `tbmqSidebar` / `tbmqPeSidebar` / `tbmqLiteSidebar` and their tab-links (the unused upstream product sidebars were removed). The site consumes the combined `sidebar` export (filtered per product by route middleware) plus `sidebarTabLinksByPrefix`.

### Route Middleware

`src/routeData.ts` (registered as `routeMiddleware` in `astro.config.ts`) is where per-route behavior lives: SEO head / canonical / OG tags, rewriting "Edit page" to the underlying `_includes` file for thin stubs, recording source files so the sitemap can derive `<lastmod>` from git, filtering the combined sidebar per edition, and marking the active parent item. Anything that has to differ per route but isn't a component belongs here.

### i18n

- **English-only** at present. `astro.config.ts` sets `defaultLocale: 'root'` (English served at the root, no `/en/` prefix).
- Ukrainian (`uk`) is **commented out** in `astro.config.ts` ("no translations yet"). The path helpers still understand a `uk/` prefix — see the note in Project Overview.
- `src/content/i18n/en.json` holds UI-string overrides for Starlight's built-in labels. It currently carries one key, and everything else resolves from Starlight's own translations via `Astro.locals.t()`.
- Lunaria translation tracking has been removed (no `lunaria.config.ts`, no `uk.json`, no `i18n.ts`).

There is **no** `config/locales.ts` and **no** per-language content directories in this repo — docs are authored once under `src/content/docs/docs/`.

### Path Alias

`~/*` and `@root/*` both map to `./src/*`. Narrower aliases exist for the common trees (all in tsconfig.json): `@models/*`, `@components/*`, `@layouts/*`, `@styles/*`, `@data/*`, `@util/*`, and `@includes/*` → `./src/content/_includes/*`.

### Starlight Customization

Custom component overrides live in `src/components/starlight/` — these replace default Starlight components (Hero, Sidebar, Footer, Search, Header, etc.). They are registered in the `starlight({ components: {...} })` block of `astro.config.ts`.

Landing/marketing components live under `src/components/` (notably `Landing/`, `MqttBroker/`, `Company/`, `Installations/`).

### Site Header

The header is the upstream ThingsBoard site's (`SiteMenu/`, `Landing/HeaderContent.astro`, the two `Header*Watch` components, `util/modal-dialog.ts`, `util/layers.ts`, `util/scroll-lock.ts`, `styles/_button.scss`), taken as is so its fixes cherry-pick. What is TBMQ's own:

- **Data** — `src/data/navigation.ts` (the menu row and its sections, in upstream's shape), `menu-featured.ts` (the promo row under a section), `cta-destinations.ts` (where Sign in and Try for free lead). `SiteMenu/menu-model.test.ts` pins the row, the section ownership and the analytics ids.
- **Product tiles** — a section's `badge` is drawn by `ProductTile`, the same tile the docs picker and the installations hub use, not upstream's badge sprites. Upstream's customer-logo links are not here either.
- **`Landing/DemoDialog.astro`** — what "Try for free" opens: the demo sign-up, or the installation docs. Any link with `data-demo-dialog` opens it; "Sign in" deliberately does not (one destination, nothing to choose).
- **Search and the theme switch** — `SearchButton.astro` keeps this site's own Google search dialog behind upstream's button; `ThemeToggle.astro` stays in the bar because the footer here has no theme choice. The dialog is a plain `div`, so it holds the shared scroll lock as the `search` owner: that is the only way `layerOver()` (edge swipes, the shortcut) knows it covers the page.

**Two layouts render it.** Docs pages get the header from Starlight (`starlight/Header.astro`); marketing pages are standalone documents here, not `<StarlightPage>` as upstream, so `BaseLayout` renders `Landing/Header.astro` itself. Both must put `HeaderContent` directly inside `header.header`: its styles key on `header.header:has(> [data-header-look])`. A page's header comes from `BaseLayout` props, resolved by `util/header-config.ts`: `hero="dark" | "light"` makes the bar see-through over a hero (the dark one needs the hero to be `#hero`), `search` adds the search button (docs pages have it by default), and `forceLightTheme` removes the theme switch. `pageId` is only a hook for a page's own CSS now; the header no longer reads it.

Breakpoints live in `_variables.scss` (`$menu-row-from`, `$bar-roomy-from`, `$menu-split-from`, `$bar-compact-below`) and are mirrored as custom properties in `_theme.scss` for `SiteMenu/menu-query.ts` — change them in the first and the second follows. `$menu-row-from` is wider than upstream's because eight menu items need the room; re-check the bar on a docs page at that width, and at `$bar-roomy-from` (where the search field widens and the star count returns), after adding an item.

Analytics ids on links that exist twice (bar and phone sheet) are kept on whichever copy shows: mark both copies with `data-analytics-id` and `SiteMenu`'s script moves the `id`. GTM hooks on these ids and nothing in this repo does, so check GTM before renaming one.

The GitHub button renders the count in `src/data/github-stars.json` and replaces it with the live one after load, so the bar never changes width; `pnpm update:stars` refreshes the file.

### Available Components

Props and usage live in each component file under `src/components/`. Commonly used in docs:

- **ImageGallery** — responsive image grid with lightbox, product suffix resolution, dark theme variants
- **DocImage** — single optimized image with width/alignment options
- **ShowFor** — product-conditional Markdown blocks (see "Shared Content via \_includes" below)
- **ConditionalHeading** — TOC-aware heading for use inside JSX conditionals in `_includes`
- **InstallOptionGrid** / **GuideLinkPanels** / **DowntimeModes** (`src/components/Installations/`) — installation index cards, grouped links to each deployment guide, and the two upgrade-downtime cards
- **DocLink** — product-aware internal links (always use instead of bare markdown links)
- **LearnLink** — links from the docs into the `/mqtt/` learn hub; takes the topic `slug`, not a path, and fails the build on an unknown one (always use instead of bare `[…](/mqtt/…/)` links)
- **Code blocks** — `maxLines`, `collapsible`, `wrap`, `download='file.ext'` meta options; `<Code>` component for dynamic code

**Asset references fail silently, not loudly.** `ImageGallery` swaps in a CDN URL (`https://img.thingsboard.io/…`) when a local asset is missing, and `InstallOptionGrid` / `GuideLinkPanels` render no icon at all (`svgModules[item.icon] ?? null`). A deleted or renamed image therefore passes both `astro check` and the build. To verify an asset change, grep the built site for `img.thingsboard.io` — there is no legitimate hit, so any match is a missing local asset.

### Product System

All product identifiers live in `src/models/site.models.ts` as the `Products` enum, which now has exactly three members:

| Enum value | URL prefix | Content directory |
|------------|------------|-------------------|
| `TBMQ` | `''` (empty) | `src/content/docs/docs/` |
| `TBMQ_PE` | `pe/` | `src/content/docs/docs/pe/` |
| `TBMQ_LITE` | `lite/` | `src/content/docs/docs/lite/` |

Adding a member to the enum means touching every exhaustive `Record<Products, …>` that hangs off it — `productDocsPrefix` (`site.models.ts`), `productVersions` (`util/path-utils.ts`), `productSuffix` (`ImageGallery.astro`), `repoMap` (`Landing/GitHubButton.astro`), `META_BY_PRODUCT` (`open-graph/_shared/product-meta.ts`). `astro check` fails loudly on each, which is the intended safety net. Don't add non-TBMQ product content — this is a TBMQ-only site.

**URL pattern:** `/docs/[product-prefix][page-slug]/` → e.g. `/docs/getting-started/` (CE), `/docs/pe/...` (PE), `/docs/lite/...` (TBMQ Lite).

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

The file holds exactly five constants: `TBMQ_VER`, `TBMQ_PREV_VER`, `TBMQ_PE_VER`, `TBMQ_BRANCH`, and `TBMQ_LITE_VER` (the `thingsboard/tbmq-lite` image tag used by the TBMQ Lite pages under `docs/lite/`). The other products' constants have been removed.

`src/data/lite.ts` holds what the TBMQ Lite product page and the Lite docs both show: the `docker run` command (`LITE_RUN_CMD`) and the measured capacity (`LITE_CAPACITY`). Change a figure or the command there, not in a page — the hero, the guarantees and comparison sections and the two docs tables all read it.

### Custom Plugins

Markdown runs on **Sätteri**, Astro 7's Rust pipeline (`markdown.processor` in `astro.config.ts`), not remark/rehype. Sätteri plugins are not unified transformers: each declares visitor subscriptions (`element`, `mdxJsxFlowElement`, `mdxjsEsm`, …) with a `filter` array — an **empty** filter matches every node of that type — and gets its own document-order pass.

Two invariants matter, and neither is obvious from a plugin's signature:

- **Our plugins are not the last writer of `astro.headings`.** Starlight and Astro each append their own heading-id collector *after* every user plugin, and each assigns a full list, so the last write wins. Anything needing the finished heading list must hook `ctx.data.astro.headings` rather than read it, and must not assume its own count matches a collector's. The exact plugin order is recorded next to `patchAstroHeadings` in `config/plugins/satteri-mdx-include-headings.ts` — that is where it can be checked against the installed Starlight, so it lives there rather than here.
- **Per-document state belongs on `ctx.data`** (fresh per page); the plugin objects themselves are reused across pages.

Plugin and visitor types come from the `satteri` package (an explicit devDependency for exactly this reason) — don't re-declare them structurally, or a shape change upstream turns into a silently empty TOC instead of a type error.

- `config/plugins/satteri-mdx-include-headings.ts` — extracts headings from `_includes` MDX files and injects them into the page TOC; supports `<ConditionalHeading>` for product-conditional headings
- `config/plugins/satteri-blog-images.ts` — for `src/content/blog/` only: injects intrinsic `width`/`height` on body `<img>` tags (read via `sharp` from `public/`) and lazy-loads every image after the first
- `config/plugins/satteri-blog-external-links.ts` — for `src/content/blog/` only: off-site body links get `target="_blank"` + `rel="noopener noreferrer"`; internal links stay same-tab (`BlogCTA` applies the same rule via `src/util/external-href.ts`)
- `config/plugins/expressive-code-max-lines.mjs` — powers the `maxLines`/`collapsible` code-block meta options

Heading ids and smart punctuation are Sätteri built-ins (they replaced `rehype-slug` and `remark-smartypants`); `smartPunctuation.dashes` stays off so `--` is left alone in CLI snippets.

Versions follow the upstream ThingsBoard site (Astro 7.4, Starlight 0.43), so shell code cherry-picks cleanly. Two things to keep in step when bumping:

- `@astrojs/markdown-satteri` and our own `satteri` devDependency must resolve to the copies `astro` uses, or our plugins are typed against one `satteri` and run by another. `astro` declares a range now, so ours is the same range (`node -e "console.log(require('./node_modules/astro/package.json').dependencies['@astrojs/markdown-satteri'])"`); check with `pnpm why @astrojs/markdown-satteri`.
- `pnpm why satteri` lists **two** versions and that is expected: Starlight 0.43 depends on `satteri` 0.10 for its own tab/steps/file-tree processors, while the Markdown pipeline runs 0.11. Don't force them together with an override.

Starlight ships compiled files under `dist/` since 0.42 and exports only a few paths. The places that reach inside it anyway are `@starlight/tabs-processor` (alias in `astro.config.ts`), `@starlight/icons` (`tsconfig.json`), the `TableOfContentsList` import in the two TOC overrides, `dist/style/props.css` in `BaseLayout`, and the `starlight-icon-override` Vite plugin — the last one fails silently when a path moves, which is why `assertIconOverrideApplied` fails the build if the swap never ran.

**Authoring rule the Rust parser imposes:** never start a line with `>`. A JSX opening tag whose closing bracket sits at the start of its own line —

```mdx
<a
  href="…"
>link text</a>
```

— reads as a Markdown blockquote to Sätteri, which abandons the tag and fails the build with `mdx-jsx:unexpected-character`. Keep the `>` on the last attribute's line (`rel="…">link text</a>`). Multi-line attributes are fine; only the leading bracket breaks. The old JS pipeline silently tolerated it, so this pattern exists in older content — any build will catch it (`lint:toc` cannot: it runs against a `dist/`, which a failed build never produces).

`pnpm lint:toc` guards the include-TOC injection: it asserts against a built `dist/` that known `_includes` headings (and a PE-only `<ConditionalHeading>`) actually reached the rendered TOC. That failure mode is invisible to every other check — `lint:linkcheck` only validates fragments that exist, so a TOC that vanished entirely produces no links and no errors.

`llms.txt` is generated by the route endpoints `src/pages/llms.txt.ts` and `src/pages/llms-small.txt.ts` (skippable in builds via `SKIP_LLMS=true`).

### Pages vs Content

- `src/content/docs/` — documentation pages rendered by Starlight (the TBMQ docs tree)
- `src/pages/` — special routes and TBMQ marketing/landing pages: root `index.astro`, `product/` (product landing, `privacy-policy`, `terms-of-use`), `pricing/`, `installations/`, `company/`, `contact-us` (+ `contact-us-thanks`), `live-demo`, `performance/` (benchmark), `mqtt/` (the MQTT learn hub, ~35 pages), `cookie-policy/`, `blog/`, `open-graph/` (OG generation), `404.astro`, `llms.txt` / `llms-small.txt`

### Typography & Design System

All non-doc pages (landing, marketing, standalone pages) share a unified typography system defined as SCSS mixins in `src/styles/_variables.scss`.

Key rules: **Never hardcode font values** — use the mixins. **Never use compile-time SCSS color variables** for theme-dependent colors — use CSS custom properties (`var(--color-*)`).

## Redirects

**Single source of truth:** `src/data/redirects.ts`. Four exports, chosen by pattern shape:

| Export | Use for | Example |
|---|---|---|
| `SINGLE_REDIRECTS` | one-off `/docs/*` page rename | `{ oldPath: '...', target: '/docs/...' }` |
| `CATCH_ALL_REDIRECTS` | `/docs/*` prefix rename (whole tree renamed 1:1) | prefix → `:splat` |
| `DYNAMIC_REDIRECTS` | splat / `:placeholder` patterns that aren't a simple prefix rename | `/old-tree/:section/page/* → /new-tree/:section/` (currently empty) |
| `NON_DOCS_REDIRECTS` | everything outside `/docs/*` (marketing, external targets) | `/old-landing/` → `/new-landing/` |

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

Per-page OG cards (1200×630 PNG) are generated at build time by Satori + Resvg. Each content collection has its own static endpoint under `src/pages/open-graph/`. `_shared/Card.tsx` is a dispatcher over two variants — both carry the same TBMQ lockup on the same green slab, so docs and marketing cards read as one site.

**Files:**
- `src/pages/open-graph/_shared/Card.tsx` — dispatcher; `DocsCard.tsx` (docs pages) and `LogoCard.tsx` (blog, marketing, collection indexes)
- `src/pages/open-graph/_shared/{Slab,StackedLogo,Background}.tsx` + `colors.ts` — shared slab, TBMQ lockup, backdrop, single `tbmq` gradient
- `src/pages/open-graph/_assets/icons.ts` — `TBMQ_LOGO_WHITE`, cropped into mark + wordmark by `StackedLogo`
- `src/pages/open-graph/_shared/page-data.ts` — resolves every page to card props (title, eyebrow, section)
- `src/pages/open-graph/_shared/marketing-meta.ts` — `PREFIX_RULES` (slab word per URL prefix) + per-page overrides
- `src/pages/open-graph/_shared/product-meta.ts` — `META_BY_PRODUCT` for docs cards
- `src/pages/open-graph/_shared/render.ts` — Satori → Resvg pipeline + content-hash cache
- `src/pages/open-graph/{collection}/[…].png.ts` — three static endpoints: **docs, blog, pages**
- `src/util/ogContext.ts` — `prettifySegment` + `ACRONYMS`, section labels, `MARKETING_ALLOWLIST`
- `src/util/getOgImageUrl.ts` — pathname → OG PNG URL aggregator

**Key facts:**
- Cache lives at `node_modules/.og-cache/` (gitignored). Bump `TEMPLATE_VERSION` in `render.ts` to invalidate — required after any change that alters what a card renders.
- `SKIP_OG=true` (used by `pnpm build:fast`) makes `renderCard` return the global fallback instead of running Satori. There is deliberately no "production build with SKIP_OG" guard — it keyed on a Netlify variable that never fires on Cloudflare Pages, and the only scripts that set `SKIP_OG` are local verification builds.
- Pages outside `MARKETING_ALLOWLIST` (or otherwise unmapped) fall back to the global OG image via `SeoMeta.astro`. Only `/404/` and `/contact-us-thanks/` do so today.
- Capitalisation of any label derived from a URL segment goes through `prettifySegment` — add to its `ACRONYMS` map rather than hand-casing, or you get "Mqtt".
- To inspect a card without the slow full build: run `pnpm dev`, read the page's `og:image` URL out of its HTML, and fetch it as-is — Satori runs on demand, so you get the real card.
- OG card URLs are clean `.png` paths in dev and production alike (Astro 7 fixed the old dev-server 404 on dynamic `.png` routes under `trailingSlash: 'always'`; the `devSafeOgImagePath()` workaround was removed with the Astro 7 upgrade). The global fallback path lives in `src/consts.ts` as `OG_FALLBACK`.

**To add a new marketing landing to OG generation:** add its pathname to `MARKETING_ALLOWLIST` in `src/util/ogContext.ts` **and** a matching `PREFIX_RULES` entry in `marketing-meta.ts` (the build throws on an allowlisted pathname with no rule), then rebuild.

## Releasing a New TBMQ Version

- `src/data/versions.ts` — set `TBMQ_PREV_VER` to the outgoing `TBMQ_VER`, then bump `TBMQ_VER`, `TBMQ_PE_VER`, and `TBMQ_BRANCH`; docs code blocks, install commands and the CE→PE same-version examples in `upgrade-instructions.mdx` pick these up.
- Release notes are hand-written prose: add the new version's section to `src/content/_includes/docs/mqtt-broker/releases.mdx` (separate CE and PE-conditional blocks; the changelog page links there).

## Code Style

- Tabs for indentation in code files; spaces for JSON, Markdown, MDX, YAML, TOML
- Prettier with `prettier-plugin-astro`, printWidth 120, single quotes, trailing commas
- ESLint flat config with TypeScript and Astro plugins

## CI Checks

GitHub Actions runs: `astro check`, `eslint`, `slugcheck`.

`lint:linkcheck` runs in a separate CI pipeline (not GitHub Actions) because it needs a full build. It must also pass before a PR can merge — so run it locally before requesting review, especially when adding, renaming, or removing pages, changing redirects, or editing internal links. Use `pnpm lint:linkcheck` for a clean check, or `pnpm lint:linkcheck:nobuild` if you already produced a build in this session.
