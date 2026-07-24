# Nav active-section highlight + primary/brand green rebrand — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Highlight the current section in the marketing top menu, and rebrand the site's primary accent + brand indigo from blue to TBMQ green `#1f8b4d`.

**Architecture:** Phase 1 computes the active nav item server-side in Astro from `Astro.url.pathname` (no JS) and colors it with `var(--color-primary)`. Phase 2 turns primary green via the Starlight accent ramp (the true render lever) plus the `$color-primary` SCSS family and its hardcoded mirrors. Phase 3 unifies the separate `--color-brand` indigo to the same green. Each phase is one independently reviewable task.

**Tech Stack:** Astro + Starlight, SCSS (tabs for indentation), CSS custom properties. No unit-test framework in this repo — verification is `pnpm check`, `pnpm build:fast`, grep audits, and manual light/dark visual QA.

## Global Constraints

- Green anchor: **`#1f8b4d`** (TBMQ dark green). Green family: hover `#35c86a`, dark `#166b3b`, darker `#0d3d22`; brand-dark (dark theme) `#7ee0a0`.
- **Never hardcode version strings**; not relevant here but keep other project rules.
- Code style: **tabs** in `.astro`/`.scss` code files; single quotes; existing comment density (only *why*, not *what*).
- Commit messages: **Conventional Commits**, **no `Co-Authored-By`** line.
- **Build policy:** before running any build, ask the user: "Run `pnpm build:fast` to verify, or skip?" Only run on approval.
- Do **not** touch the 126 `src/assets/**/*.svg` files — the SVG `#3d50f5` recolor is a deferred follow-up, out of scope for this plan.
- Do **not** reuse the `.active` CSS class for the highlight — it is owned by the hover/submenu-indicator JS. Use `current`.

---

### Task 1: Nav active-section highlight

**Files:**
- Modify: `src/data/navigation.ts` (NavItem interface + `mainNavItems` match config)
- Modify: `src/components/Landing/Navigation.astro` (frontmatter detection, `<li>`/`<a>` markup, `<style>`)

**Interfaces:**
- Produces: `NavItem.match?: string[]` — optional list of slash-terminated path prefixes marking an item current.

- [ ] **Step 1: Add `match` to the `NavItem` interface**

In `src/data/navigation.ts`, the interface currently is:

```ts
export interface NavItem {
	label: string;
	href?: string;
	submenuId?: string;
	items?: SubMenuItem[];
	target?: string;
}
```

Change it to:

```ts
export interface NavItem {
	label: string;
	href?: string;
	submenuId?: string;
	items?: SubMenuItem[];
	target?: string;
	match?: string[]; // path prefixes (each ends in '/') that mark this item current; defaults to [href]
}
```

- [ ] **Step 2: Add `match` config to `mainNavItems`**

Replace the `mainNavItems` array (currently items without `match`) with:

```ts
export const mainNavItems: NavItem[] = [
	{ label: 'Product', href: '/product/' },
	{ label: 'Live Demo', href: '/live-demo/' },
	{ label: 'Performance', href: '/performance/' },
	{ label: 'Company', submenuId: 'nav-company', match: ['/company/', '/contact-us/'] },
	{ label: 'Learn', submenuId: 'nav-learn', match: ['/mqtt/'] },
	{ label: 'Docs', href: '/docs/mqtt-broker/pe/', match: ['/docs/'] },
	{ label: 'Blog', href: '/blog/' },
];
```

- [ ] **Step 3: Import `NavItem` type in `Navigation.astro`**

In `src/components/Landing/Navigation.astro`, change the first import (line 2) from:

```ts
import { mainNavItems, allSubmenus, type SubMenu, type SubMenuItem } from '../../data/navigation';
```

to:

```ts
import { mainNavItems, allSubmenus, type SubMenu, type SubMenuItem, type NavItem } from '../../data/navigation';
```

- [ ] **Step 4: Add current-detection to the frontmatter**

In the same file, the frontmatter currently ends:

```ts
const { platformQuery = '' } = Astro.props;
---
```

Change it to:

```ts
const { platformQuery = '' } = Astro.props;

const pathname = Astro.url.pathname; // trailingSlash:'always' → always ends with '/'
const isCurrent = (item: NavItem) => {
	const prefixes = item.match ?? (item.href ? [item.href] : []);
	return prefixes.some((p) => pathname.startsWith(p));
};
---
```

- [ ] **Step 5: Mark the current `<li>` and add `aria-current`**

The nav list map currently starts:

```jsx
			{
				mainNavItems.map((item) => (
					<li
						class={`nav-${item.submenuId?.replace('nav-', '') || item.label.toLowerCase().replace(' ', '-')}`}
						data-submenu-id={item.submenuId}
					>
```

Change it to compute `current` once and append the `current` class:

```jsx
			{
				mainNavItems.map((item) => {
					const current = isCurrent(item);
					return (
					<li
						class={`nav-${item.submenuId?.replace('nav-', '') || item.label.toLowerCase().replace(' ', '-')}${current ? ' current' : ''}`}
						data-submenu-id={item.submenuId}
					>
```

Then add `aria-current` to the `<a>`. It currently opens:

```jsx
							<a
								class="main-menu-link"
								id={
```

Change to:

```jsx
							<a
								class="main-menu-link"
								aria-current={current && item.href && pathname === item.href ? 'page' : undefined}
								id={
```

Finally, close the new arrow-function block. The map currently ends:

```jsx
					</li>
				))
			}
```

Change it to:

```jsx
					</li>
					);
				})
			}
```

- [ ] **Step 6: Add the highlight CSS**

In the same file's `<style lang="scss" is:global>` block, insert the following immediately **before** the line `// Responsive styles for navigation` (currently around line 863). Use tab indentation to match the file:

```scss
	// Persistent "current page" highlight for the active top-level section.
	// Uses `current` (not `.active`, which the hover/indicator JS owns). One
	// low-specificity rule wins on every page a nav item targets, because those
	// pages all use the solid/light header — the id-scoped white-text overrides
	// only exist for the transparent dark-hero pages, which no nav item targets.
	.head-menu ul li.current > a,
	.head-menu ul li.current > span.main-menu-link {
		color: var(--color-primary);
	}

	// Mobile burger drawer: the per-page-id `#live-demo … opened-burger … a`
	// rules in HeaderContent carry an id (1,3,3) and out-specify the rule above,
	// so the drawer needs `!important` — consistent with that stylesheet's
	// established pattern for defeating id/brand specificity.
	.opened-burger .head-menu ul li.current > a,
	.opened-burger .head-menu ul li.current > span.main-menu-link {
		color: var(--color-primary) !important;
	}
```

- [ ] **Step 7: Type-check**

Run: `pnpm check`
Expected: no new errors from `navigation.ts` or `Navigation.astro`.

- [ ] **Step 8: Build to verify (ask first)**

Ask the user: "Run `pnpm build:fast` to verify, or skip?" If approved, run `pnpm build:fast`.
Expected: build succeeds.

- [ ] **Step 9: Visual QA (dev server)**

Run `pnpm dev` and confirm the correct top-menu item is colored (and only that one) on: `/product/`, `/live-demo/`, `/performance/`, `/company/`, `/contact-us/` (→ Company), `/mqtt/` and a `/mqtt/<slug>/` guide (→ Learn), `/docs/mqtt-broker/getting-started/` and a `/pe/` page (→ Docs), `/blog/` and a blog post (→ Blog). Confirm `/` (home) shows **no** highlight. Confirm the highlight also shows in the mobile burger drawer (narrow the viewport). Note: highlight color is still the current accent (indigo) until Task 2 — verify the correct item highlights, not the color.

- [ ] **Step 10: Commit**

```bash
git add src/data/navigation.ts src/components/Landing/Navigation.astro
git commit -m "feat(nav): highlight active top-menu section"
```

---

### Task 2: Primary accent → green

**Files:**
- Modify: `src/styles/_variables.scss` (the `$color-primary` family)
- Modify: `src/styles/_theme.scss` (`--color-primary-rgb`)
- Modify: `src/styles/_starlight-overrides.scss` (Starlight accent ramp, light + dark)
- Modify (bulk): 7 files with hardcoded `#2a7dec` (see Step 4)

**Interfaces:**
- Produces: green `--color-primary` / `--sl-color-text-accent` consumed by Task 1's highlight and ~33 `var(--color-primary)` sites.

- [ ] **Step 1: Recolor the `$color-primary` SCSS family**

In `src/styles/_variables.scss`, this block:

```scss
$color-primary: #2a7dec;
$color-primary-hover: #4f97f8;
$color-primary-dark: #305680;
$color-primary-darker: #0d2743;
```

becomes:

```scss
$color-primary: #1f8b4d;
$color-primary-hover: #35c86a;
$color-primary-dark: #166b3b;
$color-primary-darker: #0d3d22;
```

- [ ] **Step 2: Recolor the primary RGB (shadow) token**

In `src/styles/_theme.scss`, change:

```scss
	--color-primary-rgb: 61, 80, 245;
```

to:

```scss
	--color-primary-rgb: 31, 139, 77;
```

- [ ] **Step 3: Define the green Starlight accent ramp**

In `src/styles/_starlight-overrides.scss`, the main light `:root` block (lines 6–13) currently ends:

```scss
	--sl-nav-height: calc(#{$header-height} + var(--promo-cur, var(--promo-h, 0px)));
	--sl-sidebar-width: 300px;
}
```

Add the accent tokens before the closing brace, then add a dark-theme block right after it:

```scss
	--sl-nav-height: calc(#{$header-height} + var(--promo-cur, var(--promo-h, 0px)));
	--sl-sidebar-width: 300px;

	// Brand-green accent ramp — overrides Starlight's default indigo so
	// --color-primary (which aliases --sl-color-text-accent) is green sitewide,
	// on docs and marketing alike. Anchored on #1f8b4d; text-accent is a shade
	// darker so link text clears AA (4.5:1) on white.
	--sl-color-accent-low: #cdefda;
	--sl-color-accent: #1f8b4d;
	--sl-color-accent-high: #145c33;
	--sl-color-text-accent: #1a7f46;
}

:root[data-theme='dark'] {
	--sl-color-accent-low: #133a26;
	--sl-color-accent: #22a35a;
	--sl-color-accent-high: #a7e8c1;
	--sl-color-text-accent: #4ade80;
}
```

- [ ] **Step 4: Replace hardcoded `#2a7dec` mirrors**

Run this scoped replacement (excludes the `$color-primary` definition, the README doc, and the HeaderContent comment that merely lists brand hexes):

```bash
grep -rIl '#2a7dec' src \
  | grep -vE 'README|_variables\.scss|HeaderContent\.astro' \
  | xargs sed -i 's/#2a7dec/#1f8b4d/g'
```

This touches: `layouts/LegalLayout.astro`, `styles/_iot-article.scss`, `pages/installations/index.astro`, `pages/contact-us-thanks.astro`, `pages/cookie-policy/index.astro`, `pages/community/index.astro`, `components/Services/InnerNavigation.astro`.

- [ ] **Step 5: Audit — no stray primary-blue left in code**

Run: `grep -rIn '#2a7dec' src | grep -v node_modules`
Expected: matches **only** in `src/styles/README.md` (doc text) and `src/components/Landing/HeaderContent.astro` (the comment listing brand hexes). No `.scss`/`.astro` style values.

- [ ] **Step 6: Contrast check**

Verify `--sl-color-text-accent` light `#1a7f46` on white ≥ 4.5:1 and dark `#4ade80` on `#141517` ≥ 4.5:1 (any WCAG contrast checker). If light is short, darken toward `#166b3b` and re-check. Record the final value in the commit body if changed.

- [ ] **Step 7: Type-check + build (ask first)**

Run: `pnpm check`. Then ask the user about `pnpm build:fast`; run on approval.
Expected: pass / build succeeds.

- [ ] **Step 8: Visual QA, light + dark**

On `pnpm dev`, confirm green (not indigo) for: doc body links, nav hover + the Task 1 active highlight, the "Try it now" header CTA, focus rings, and any `--shadow-primary` glow. Check both light and dark themes on a docs page and a marketing page.

- [ ] **Step 9: Commit**

```bash
git add src/styles/_variables.scss src/styles/_theme.scss src/styles/_starlight-overrides.scss \
	src/layouts/LegalLayout.astro src/styles/_iot-article.scss src/pages/installations/index.astro \
	src/pages/contact-us-thanks.astro src/pages/cookie-policy/index.astro src/pages/community/index.astro \
	src/components/Services/InnerNavigation.astro
git commit -m "feat(theme): rebrand primary accent from blue to green"
```

---

### Task 3: Brand indigo → green (chrome)

**Files:**
- Modify: `src/styles/_variables.scss` (`$color-brand`, `$color-brand-dark`)
- Modify: `src/components/Banner.astro` (fallback hex)
- Modify: `src/components/Pricing/CalculatorModal.astro` (JS fallback hex)
- Review only (auto-follow the token): `Landing/Footer.astro`, `Pagination/Pagination.astro`, `Pagination/PerPageSelector.astro`, `Breadcrumbs.astro`, `Carousel/Carousel.astro`

**Interfaces:**
- Consumes: nothing from Task 2 (independent token). Produces: green `--color-brand` for the 5 consumers above.

- [ ] **Step 1: Recolor the brand tokens**

In `src/styles/_variables.scss`, this block:

```scss
$color-brand: #3d50f5;
$color-brand-dark: #b3c7ff;
```

becomes:

```scss
$color-brand: #1f8b4d;
$color-brand-dark: #7ee0a0;
```

(The `--color-brand-contrast` overrides in `_theme.scss` — white in light, `$color-primary-darker` in dark — stay as-is; both give legible text on the green brand button.)

- [ ] **Step 2: Update the `Banner.astro` fallback hex**

In `src/components/Banner.astro`, change:

```astro
		--tb-banner-color: var(--color-product-cloud, #3d50f5);
```

to:

```astro
		--tb-banner-color: var(--color-product-cloud, #1f8b4d);
```

- [ ] **Step 3: Update the CalculatorModal JS fallback hex**

In `src/components/Pricing/CalculatorModal.astro`, change:

```js
			primary: cs.getPropertyValue('--sl-color-text-accent').trim() || '#3D50F5',
```

to:

```js
			primary: cs.getPropertyValue('--sl-color-text-accent').trim() || '#1f8b4d',
```

- [ ] **Step 4: Confirm the Cloud-product side effect**

`--color-product-cloud: var(--color-brand)` (light + dark, in `_theme.scss`) aliases brand, so the TBMQ Private Cloud accent now turns green too. Load a page using the Cloud accent (e.g. the products/pricing Cloud card, and the promo banner via `Banner.astro`) and confirm green looks right. If Cloud must keep a distinct hue, pin `--color-product-cloud` to an explicit value in both `:root` blocks of `_theme.scss` instead of the alias, and note it in the commit body.

- [ ] **Step 5: Audit — remaining `#3d50f5` are SVG-only**

Run: `grep -rIin '#3d50f5' src | grep -v node_modules | grep -vE '\.svg:'`
Expected: **no output** (every remaining `#3d50f5` lives in a `.svg` asset, which is the deferred follow-up).

- [ ] **Step 6: Type-check + build (ask first)**

Run: `pnpm check`. Then ask the user about `pnpm build:fast`; run on approval.
Expected: pass / build succeeds.

- [ ] **Step 7: Visual QA, light + dark**

Confirm green for: footer subscribe button, pagination active/hover, breadcrumbs, carousel accent, and the promo banner. Check both themes.

- [ ] **Step 8: Link check before PR**

Run: `pnpm lint:linkcheck` (or `pnpm lint:linkcheck:nobuild` if a build already ran this session).
Expected: passes (no URL/route changes were made).

- [ ] **Step 9: Commit**

```bash
git add src/styles/_variables.scss src/components/Banner.astro src/components/Pricing/CalculatorModal.astro
git commit -m "feat(theme): rebrand brand indigo to green across chrome"
```

---

## Notes for the implementer

- After the rebrand, primary green `#1f8b4d` equals `$color-success` — intentional. During QA, glance at any UI that shows success + primary together to make sure they're still distinguishable in context.
- The green ramp values in Task 2 Step 3 are the target if hand-authored. If you prefer exact Starlight-generated values, paste them from Starlight's theme editor keyed on `#1f8b4d` — but keep `--sl-color-text-accent` AA-compliant per Step 6.
- Follow-up (separate plan): recolor the 126 `src/assets/**/*.svg` diagram files' `#3d50f5` to green, handling `-dark.svg` variants and edge-product diagrams.
