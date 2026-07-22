# MQTT Learn page redesign — design spec

- **Date:** 2026-07-22
- **Status:** Approved (design); implementation not started
- **Scope owner surface:** `/mqtt/*` learn hub (32 topic pages)
- **Reference mockup:** `docs/superpowers/report/mqtt-guide-redesign.html` — visual reference ONLY. Its HTML/CSS/hex values are not copied into the codebase.

## Goal

Redesign the `/mqtt` learn topic page from a single centered column into a 3-column reading layout with a tinted hero, a sticky table-of-contents rail, a sticky "How TBMQ handles this" CTA rail, card grids, and a tinted diagram panel — reusing existing components and design tokens, with no new hex colors. The redesign is applied through the shared layout so all 32 topic pages receive the new frame; `what-is-mqtt` is the first page whose body is upgraded and the review vehicle.

## Constraints

- Keep the current nav and TBMQ green. **No new hex values** — all colors come from existing SCSS tokens (`$color-pe*`, `$color-text*`, `$color-bg*`, `$color-border`); tints are `rgba()` of the green tokens (the pattern the `/mqtt` hub already uses).
- Reuse existing components and tokens throughout. Real icon set = `astro-icon` tabler icons (mockup icons are placeholders).
- Keyboard-focusable, respects `prefers-reduced-motion`, responsive down to mobile.
- **Do not commit until the user approves.**

## Decisions (resolved during brainstorming)

1. **Where the redesign lives:** the shared `MqttTopicLayout.astro` + shared components. All 32 pages get the new frame at once; `what-is-mqtt` is perfected first and is the review vehicle. Per-page body upgrades (card grids) roll out page-by-page afterward. No throwaway/prototype code.
2. **Section-background rhythm:** tint only the naturally-bounded structured blocks (diagram panel, feature-card grid, concept-card grid). Plain prose sections stay on the plain ground. "Sparing" by construction; no fragile grouping of arbitrary prose.
3. **TOC source:** auto-generated from the page's `.learn-body h2` headings via a small client script + `IntersectionObserver` scrollspy. Zero per-page authoring; all 32 get a TOC free. Progressive — no JS means the rail simply doesn't render and content is unaffected.
4. **`HowTbmqBlock` relocates into the sticky right rail**; its full-width instance is removed (approved judgment call).
5. **All 14 existing concept links are kept** as cards — no content dropped (approved judgment call).
6. **Diagram canvas is tinted globally** in `MqttDiagram.astro` for consistency across every learn diagram (approved judgment call).

## Architecture

### Files edited (shared — affect all 32 pages)

- `src/components/MqttLearn/MqttTopicLayout.astro` — the core change. Adds: full-bleed tinted hero band (breadcrumb + eyebrow + H1 + `QuickAnswer`), the 3-column body grid, the TOC rail markup + scrollspy script, and the sticky TBMQ rail. FAQ moves into the center column; `RelatedTopics` + `LearnCta` stay full-width below the grid.
- `src/components/MqttLearn/HowTbmqBlock.astro` — restyled to render inside the ~300px sticky rail. Its previous full-width placement in the layout is removed. Content is unchanged (still driven by `topic.tbmqTieIn` + the two links, now styled as buttons).
- `src/components/MqttLearn/MqttDiagram.astro` — `.mqtt-diagram__canvas` background changes from white to a subtle green tint (`rgba($color-pe, ~0.05)`). Border, radius, zoom, and reduced-motion behavior are unchanged. The white `.d-actor` boxes pop against the tint.

### Files added (small, focused, reusable)

- `src/components/MqttLearn/LearnFeatureGrid.astro` — a responsive grid of feature cards, each = tabler icon in a tinted chip + title + one-line text. Props: an array of `{ icon, title, text }`.
- `src/components/MqttLearn/LearnCardGrid.astro` — a responsive grid of link tiles. Props: an array of `{ href, title, blurb }`. Visual style cribbed from the existing `RelatedTopics` cards (hover lift, green border on hover).

### Files edited (page body — `what-is-mqtt` only, for now)

- `src/pages/mqtt/what-is-mqtt.astro` — the "Why MQTT is used for IoT" `<ul>` becomes `<LearnFeatureGrid>`; the "Core MQTT concepts" `<ul>` becomes `<LearnCardGrid>`. All prose, links, FAQ, and the diagram are otherwise unchanged.

### Rollout model

The other 31 topic pages inherit the new frame automatically (layout is shared) and keep their existing prose bodies. Their bodies are upgraded to card grids individually in later passes — out of scope for this spec.

## Detailed design

### Layout & responsive

- Body wrapper contains a CSS grid: `[TOC ~230px] [content minmax(0, 1fr), capped ~720px] [rail ~300px]`, gap ~48px, `align-items: start`.
- Center column holds the `<slot/>` **and** the FAQ, so the TOC and rail stay alongside both.
- `RelatedTopics` + `LearnCta` render full-width below the grid (unchanged).
- **`media-up(lg)` (≥ 1024px):** three columns; TOC and rail are `position: sticky; top: calc(#{$header-height} + <gap>)`.
- **`media-down(lg)` (≤ 1023px):** single column. TOC `display: none`. Rail drops below the content — the same position the full-width "How TBMQ" block occupies today, so mobile is essentially unchanged from the current page.
- Breakpoint tokens confirmed present: `media-up(lg)`/`media-down(lg)` map to `$breakpoint-lg: 1024px`.

### Hero (tinted background)

- Breadcrumb + eyebrow + H1 + `QuickAnswer` move into a full-bleed `.learn-hero-band`.
- Background reuses the `/mqtt` hub's halo technique: a soft green radial `radial-gradient(… rgba($color-pe, ~0.12), transparent)` over a faint cool ground, fading into the body below. Same visual family as the hub so the two read as one system.
- `QuickAnswer` component is reused as-is inside the band.

### TOC rail (auto + scrollspy)

- Layout renders `<nav class="learn-toc" aria-label="On this page">` (empty container).
- A module script (same pattern as `MqttDiagram`'s inline script; re-run on `astro:page-load`) reads `.learn-body h2`, assigns slugified `id`s where missing, builds the links, and uses `IntersectionObserver` to set the active link.
- Active link: `aria-current="true"` + `$color-pe-link` text + green left-border accent.
- No-JS: the nav stays empty and is visually hidden; content is unaffected.

### TBMQ rail (repurposed `HowTbmqBlock`)

- The sticky right card is `HowTbmqBlock`, restyled for the ~300px column.
- Content: the per-topic `tbmqTieIn` text + two actions rendered as buttons — "Explore the architecture" (green) and "Read the docs" (ghost) — using existing button tokens. `tabler:bolt` icon retained.
- A small muted meta line beneath (e.g. "Free · Apache-2.0 · self-hosted or cloud").
- The rail heading sits outside `.learn-body`, so it is not picked up by the TOC scrollspy.

### Card grids

- **Feature grid** (`LearnFeatureGrid`): 2 columns desktop, 1 column mobile. Each card = tabler icon in a tinted chip + title + one-line text. Proposed icons for `what-is-mqtt`: Lightweight → `tabler:feather`; Resilient → `tabler:refresh-alert` (or `tabler:shield-check`); Scalable → `tabler:topology-star-3`; Stateful → `tabler:database`.
- **Concept grid** (`LearnCardGrid`): 2-column link tiles with hover lift, matching `RelatedTopics`. Keeps all 14 existing concept links, each with its current one-liner.

### Diagram

- The existing SVG is reused untouched.
- `MqttDiagram`'s canvas background becomes a subtle green tint (`rgba($color-pe, ~0.05)`); border/radius/zoom/caption unchanged.

### Accessibility & motion

- TOC links and rail actions are real `<a>` / `<button>` with visible `:focus-visible` outlines (`$color-pe`), matching the diagram's existing focus pattern.
- `scroll-behavior: smooth` and any transitions are gated behind `@media (prefers-reduced-motion: no-preference)`. Scrollspy changes color/opacity only — no motion.
- Semantics: `<nav aria-label="On this page">`, `<aside>` rail, `aria-current` on the active TOC link.
- Sticky offsets use `$header-height` so nothing hides beneath the fixed header.

### Tokens / no new hex

- Colors from `$color-pe* / $color-text* / $color-bg* / $color-border`; spacing scale; `media-up()`.
- Tints are `rgba()` of the green tokens (the hub's existing pattern). No new hex enters the codebase.

## Verification plan

- `pnpm check` (astro type-check) — 0 errors.
- `pnpm lint:eslint` — clean.
- `pnpm lint:slugcheck` — clean.
- `pnpm exec prettier --write` on all touched files, then `--check`.
- Headless-Chrome visual pass on `what-is-mqtt` (the review page) at desktop and mobile: 3-col → 1-col collapse, sticky TOC + rail, tinted hero, tinted diagram, card grids, scrollspy active state, focus outlines.
- Spot-check a non-upgraded page (e.g. `qos`) to confirm the shared frame renders correctly with a prose body and the TOC auto-populates.
- Build gate (`pnpm build:fast` + `pnpm lint:linkcheck`) only after the user asks (repo build policy).

## Out of scope

- Upgrading the bodies of the other 31 topic pages to card grids (they inherit only the frame now).
- Any change to nav, footer, the dark CTA band, `RelatedTopics`, `LearnCta`, or the hub (`/mqtt/index`).
- New color tokens or icon assets beyond the existing tabler set.
