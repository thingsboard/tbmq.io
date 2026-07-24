# Top-menu active-section highlight + primary/brand green rebrand

**Date:** 2026-07-24
**Status:** Design — awaiting review
**Scope:** `tbmq.io` marketing header + site-wide accent/brand color tokens

## Overview

Two related pieces of work, sequenced as phases in one spec:

1. **Nav active-section highlight** — the marketing top menu (Product, Live Demo,
   Performance, Company, Learn, Docs, Blog) should highlight the item matching the
   current page, the way the `/live-demo/` redesign mockup showed "Live Demo" in the
   brand color.
2. **Primary + brand color rebrand blue → green** — flip the site's primary accent
   (today Starlight's default indigo, `~#3d50f5`) and the separate brand indigo
   (`$color-brand: #3d50f5`) to TBMQ green **`#1f8b4d`**.

The two are coupled: the highlight uses `var(--color-primary)`, so once primary turns
green the highlight is green automatically. Phase 1 is independent and can ship first.

The 126 brand-indigo **SVG diagram assets** are explicitly **out of scope** here and
tracked as a separate follow-up pass (see [Follow-up](#follow-up-out-of-scope)).

### Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Active-item style | **Color only**, normal weight (no bold, no underline bar) |
| Highlight color | `var(--color-primary)` (matches hover, theme-aware) |
| Match scope | **Section-aware** (parents highlight on their sub-pages) |
| Green shade | **`#1f8b4d`** (TBMQ dark green = `$color-success` / mqtt-broker nav brand / artifact) |
| Rebrand reach | **Full chrome** — primary accent **and** brand indigo → green |
| SVG diagrams | **Separate follow-up**, not this spec |

---

## Phase 1 — Nav active-section highlight

**Files:** `src/data/navigation.ts`, `src/components/Landing/Navigation.astro`.
No JS — computed server-side at build, so no flash and no hydration cost.

### 1a. Matching model (`navigation.ts`)

Extend `NavItem` with an optional `match?: string[]` (list of path **prefixes**, each
ending in `/`). When absent, matching falls back to `[href]`.

```ts
export interface NavItem {
	label: string;
	href?: string;
	submenuId?: string;
	items?: SubMenuItem[];
	target?: string;
	match?: string[]; // path prefixes that mark this item current; defaults to [href]
}
```

`mainNavItems` match config:

| Item | href | `match` |
|---|---|---|
| Product | `/product/` | — (defaults to `['/product/']`) |
| Live Demo | `/live-demo/` | — |
| Performance | `/performance/` | — |
| Company | _(submenu)_ | `['/company/', '/contact-us/']` |
| Learn | _(submenu)_ | `['/mqtt/']` |
| Docs | `/docs/mqtt-broker/pe/` | `['/docs/']` (whole docs tree, not just PE) |
| Blog | `/blog/` | — (index + posts) |

### 1b. Detection (`Navigation.astro` frontmatter)

```ts
const pathname = Astro.url.pathname; // trailingSlash:'always' → always ends with '/'
const isCurrent = (item: NavItem) => {
	const prefixes = item.match ?? (item.href ? [item.href] : []);
	return prefixes.some((p) => pathname.startsWith(p));
};
```

`startsWith` with slash-terminated prefixes is safe against false matches
(`/products/` does **not** start with `/product/`; `/performance-x/` does not start
with `/performance/`).

### 1c. Markup

- Add `current` to the matched `<li>`'s class list (alongside the existing
  `nav-*` class). **Do not reuse `.active`** — that class is already owned by the
  hover/submenu-indicator JS.
- Add `aria-current="page"` to the `<a>` **only when `pathname === item.href`
  exactly** (a genuine "you are here" link). Section matches (Docs on a sub-page,
  Learn on a guide) get the visual `current` class only — no misleading
  `aria-current="page"` on a link that doesn't point to the current URL.

### 1d. Styling (`Navigation.astro` `<style>`)

One rule, no `!important` needed for desktop:

```scss
.head-menu ul li.current > a,
.head-menu ul li.current > span.main-menu-link {
	color: var(--color-primary);
}
```

**Why one low-specificity rule suffices on desktop:** every page a nav item targets
(`#product`, `#live-demo`, `#performance`, `#company`, `#contact-us`, `#mqtt-learn`,
`#blog`, and docs which have no `html` id) uses the **solid/light** header. The
high-specificity white-text overrides (`#mqtt-broker header .head-menu ul a`, the
`.flip-nav` block) only exist for transparent **dark-hero** pages (`#home`,
`#thingsboard-*`, `#mqtt-broker`), and **no top-nav item ever targets those** — so
`(0,2,3)` cleanly beats the base `.head-menu ul a` `(0,1,2)` in every real case.

**Mobile burger drawer:** the per-page-id `#live-demo … header.header.opened-burger
… a` rules carry an id `(1,3,3)` and out-specify the rule above. Add one companion
rule so the current item stays green in the open drawer:

```scss
.opened-burger .head-menu ul li.current > a,
.opened-burger .head-menu ul li.current > span.main-menu-link {
	color: var(--color-primary);
}
```

If the id-scoped rule still wins in a build check, escalate to `!important` on this
companion rule — consistent with the stylesheet's established pattern for defeating
id/brand specificity (already used throughout `HeaderContent.astro`'s dark-theme
block). Verify empirically with a build before choosing.

---

## Phase 2 — Primary accent → green

Turn `--color-primary` (and everything that mirrors it) from indigo to `#1f8b4d`.
Two independent levers both must change to the same green:

1. **Runtime token (drives `var(--color-primary)` + all docs accent):** define the
   Starlight accent ramp — currently inherited from Starlight defaults and never
   overridden — in `src/styles/_starlight-overrides.scss` (loaded on every route).
2. **Compile-time SCSS (`$color-primary`):** drives nav hover/active, the "Try it
   now" CTA, and many `_base`/`_layout`/pricing rules directly.

### 2a. Starlight accent ramp (`_starlight-overrides.scss`)

Add explicit `--sl-color-accent-*` / `--sl-color-text-accent` for light and dark.
Anchor **`#1f8b4d`** (HSL ≈ 146°, 64%, 33%). Proposed ramp — **all values must be
WCAG-verified during implementation (see [Verification](#verification)); darken
`--sl-color-text-accent` if it misses 4.5:1 on white**:

| Token | Light | Dark |
|---|---|---|
| `--sl-color-accent-low` | `#cdefda` (pale green surface) | `#133a26` (deep green bg) |
| `--sl-color-accent` | `#1f8b4d` | `#22a35a` |
| `--sl-color-accent-high` | `#145c33` (high-contrast) | `#a7e8c1` (pale text) |
| `--sl-color-text-accent` | `#1a7f46` (link text, verify ≥4.5:1) | `#4ade80` (matches `--brand-pe`) |

> Note: `#1f8b4d` on white is ≈4.2:1 — just under AA for normal text. That's why
> `--sl-color-text-accent` (used for link text) is set a shade darker than the anchor.
> Consider generating the ramp with Starlight's official theme editor and pasting the
> exact output; the table above is the target if hand-authored.

### 2b. Token mirrors (`src/styles/_variables.scss` + `_theme.scss`)

| Token | From | To |
|---|---|---|
| `$color-primary` | `#2a7dec` | `#1f8b4d` |
| `$color-primary-hover` | `#4f97f8` | `#35c86a` (= `$color-pe-hover`) |
| `$color-primary-dark` | `#305680` | `#166b3b` |
| `$color-primary-darker` | `#0d2743` | `#0d3d22` |
| `--color-primary-rgb` (`_theme.scss`) | `61, 80, 245` | `31, 139, 77` (powers `--shadow-primary`) |

`$color-primary-hover`/`-dark`/`-darker` consumers: `_layout.scss` (skewed
backgrounds, borders), `pricing/index.astro`, `404.astro` text-shadow. Greening the
whole family keeps those coherent.

### 2c. Hardcoded `#2a7dec` mirrors (~14 spots)

Replace `#2a7dec` → `#1f8b4d` in: `LegalLayout.astro`, `contact-us-thanks.astro`,
`cookie-policy/index.astro`, `community/index.astro` (×2), `_iot-article.scss`,
`Services/InnerNavigation.astro` (`$blue` local), `installations/index.astro` (×5).
Skip `src/styles/README.md` (doc text) and the `_variables.scss` definition (handled
in 2b). Prefer referencing a token where the surrounding code already does; otherwise
a literal green replacement matches the file's existing style.

---

## Phase 3 — Brand indigo → green (chrome)

Unify the separate brand indigo with the new green so the "Try it now" CTA (already
`$color-primary`, greened in Phase 2), footer subscribe, promo banner, pagination,
and breadcrumbs all read as one green brand.

### 3a. Brand tokens (`_variables.scss` + `_theme.scss`)

| Token | From | To |
|---|---|---|
| `$color-brand` | `#3d50f5` | `#1f8b4d` |
| `$color-brand-dark` | `#b3c7ff` | `#7ee0a0` (light green for dark theme) |
| `--color-brand-contrast` light | `$color-white` | keep white (AA on `#1f8b4d`) |
| `--color-brand-contrast` dark | `$color-primary-darker` | keep (now dark green — dark text on light-green button) |

### 3b. `--color-brand` consumers (auto-follow the token — verify only)

`Landing/Footer.astro` (subscribe), `Pagination/Pagination.astro`,
`Pagination/PerPageSelector.astro`, `Breadcrumbs.astro`, `Carousel/Carousel.astro`.

### 3c. Two hardcoded `.astro` brand spots

`#3d50f5` → `#1f8b4d` in `components/Banner.astro` and
`components/Pricing/CalculatorModal.astro` (the latter is a JS fallback for
`--sl-color-text-accent`, rarely hit once 2a lands, but update for consistency).

### 3d. Side effect to confirm — Cloud product accent

`--color-product-cloud: var(--color-brand)` (light + dark) aliases brand indigo, so it
**turns green** with this phase. On a TBMQ-only site "Cloud" = TBMQ Private Cloud;
green is plausibly fine, but **confirm during review** — if Cloud should keep a
distinct hue, pin `--color-product-cloud` to an explicit value instead of the alias.

---

## Verification

Run after each phase (ask before building, per project policy: `pnpm build:fast`):

- **Build:** `pnpm build:fast` clean; `pnpm check`; `pnpm lint:eslint`.
- **Contrast (Phase 2/3):** verify `--sl-color-text-accent` (light) and any green-on-
  white / white-on-green pairs meet WCAG AA (4.5:1 text, 3:1 UI). Darken the token if
  short.
- **Visual QA, light + dark, marketing + docs:**
  - Nav highlight correct on `/product/`, `/live-demo/`, `/performance/`, `/company/`,
    `/contact-us/`, `/mqtt/` + a `/mqtt/<slug>/` guide, `/docs/…` (CE + PE), `/blog/` +
    a post. Home (`/`) shows **no** highlight.
  - Highlight visible in the mobile burger drawer.
  - Green reads correctly for: doc links, nav hover/active, "Try it now" CTA, footer
    subscribe, promo banner, pagination, breadcrumbs, focus rings, `--shadow-primary`.
  - No stray indigo left in chrome (spot-check the pages touched in 2c/3c).
- **Links:** `pnpm lint:linkcheck` (no URL/route changes expected, but run before PR).

## Risks

- **Contrast regression** — green anchor is darker than the indigo it replaces; the
  text-accent step is the main risk. Mitigated by the verify-and-darken step.
- **Specificity in mobile drawer** (Phase 1) — resolved by the companion rule +
  build check.
- **Over-greening via `--color-product-cloud` alias** (3d) — flagged for review.
- **Missed hardcodes** — the greps in this spec are the source of truth; re-run them
  after edits to confirm zero remaining `#2a7dec` (chrome) and, for Phase 3, that
  remaining `#3d50f5` are **only** in `src/assets/**/*.svg` (the deferred set).

## Follow-up (out of scope)

**SVG diagram recolor** — 126 `.svg` files under `src/assets/` (schemas, QoS
diagrams, cluster/queue topology, edge docs diagrams) hardcode `#3d50f5` (176
occurrences). Recolor to green as a separate bulk pass with its own visual QA:
handle `-dark.svg` variants, and confirm edge-product diagrams that may not ship on
this TBMQ-only site. Tracked separately; not part of this spec's PR.
