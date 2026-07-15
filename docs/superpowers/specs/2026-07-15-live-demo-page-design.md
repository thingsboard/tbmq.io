# `/live-demo/` marketing landing page — design

**Date:** 2026-07-15
**Status:** Approved (pending spec review)
**Context:** Part of the TBMQ marketing-page initiative (see the `tbmq-page-gap-analysis` memo). The top-nav "Live Demo" button currently links straight to `https://demo.tbmq.io/signup` (new tab). This replaces that with a dedicated, indexable `/live-demo/` landing page that gives context before sending visitors to the demo, and adds internal-link equity.

## Goal

A clean, on-brand, indexable marketing page at `/live-demo/` that:

1. Leads with the **web-dashboard tour** (primary): "create a free demo account and explore the TBMQ management UI."
2. Offers the **hands-on MQTT connect** as a secondary, no-signup path.
3. Funnels toward production (PE trial / Private Cloud).

The page must be **additive and merge-safe** — new files plus TBMQ-local edits only. It must not touch the shared upstream files kept intact for merge compatibility (`Products` enum, `versions.ts`, `astro.sidebar.ts`, redirect tables, content schemas).

## Positioning & content

Dashboard-first, both paths present. The demo has two distinct access models, and the page must represent both accurately:

- **Web dashboard** (`demo.tbmq.io`) — **requires a free account.** Primary CTA → `https://demo.tbmq.io/signup` (new tab). Copy sets the expectation ("create a free demo account to explore the UI").
- **MQTT broker endpoint** (`demo.tbmq.io`) — **no signup.** Username `demo`, no password. Ports: MQTT 1883, MQTTS 8883, WS 8084, WSS 443. CA cert at `/resources/tbmq-demo-root-ca.pem`.

### Page sections (top → bottom)

1. **Hero** — headline + one-line positioning; a live **Online/Offline status pill** (pinger); primary CTA **"Create free demo account" → `demo.tbmq.io/signup`** (new tab); a small secondary anchor link "or connect a client ↓".
2. **Dashboard tour** — **text-only** (no screenshot). A few sentences on what evaluators can explore in the web UI (client sessions, shared subscriptions, monitoring, etc.); repeat the signup CTA; state that a free account is needed.
3. **Connect a client (no signup)** — secondary path. A marketing-styled **connection card** (host, ports, username `demo`, password *none*, CA-cert download) with copy-to-clipboard buttons, plus a compact `mosquitto` example with **three tabs: Subscribe / Publish / Subscribe over TLS** (mirrors the current docs page fully).
4. **Safety note** — "shared public environment, all messages/topics are visible to other users, do not transmit sensitive data" (reuse the docs wording).
5. **Ready for production?** — the two cards from the docs live-demo page, restyled to match:
   - **TBMQ Professional** → `/docs/mqtt-broker/pe/installation/` ("Start free trial")
   - **TBMQ Private Cloud** → `/pricing/?section=tbmq-options&product=tbmq-private-cloud` ("Learn more")

## Route, layout, page id

- New page: `src/pages/live-demo.astro` → served at `/live-demo/`.
- Uses `BaseLayout` with the same prop shape as `src/pages/performance/index.astro`:
  - `forceLightTheme` (light-only marketing page, consistent with `/performance/`)
  - `title`, `description` (SEO-focused, keyword "live MQTT broker demo / try TBMQ")
  - `pageId="live-demo"` → becomes the `<html>` id `#live-demo`, which the header selectors key off
  - `gitHubPlatform={Products.TBMQ}`
- The page is a thin composition of section components (like `performance/index.astro`).
- Optional scoped `<style>` block may set the page accent tokens (`--tb-main-color` / `--tb-main-color-hover`), mirroring the pattern in `performance/index.astro`. Default to the site brand primary; align to the PE accent only if we want visual kinship with `/performance/`.

## Components (`src/components/LiveDemo/`)

Purpose-built, marketing-styled (see Design system). Suggested split:

- `LiveDemoHero.astro` — hero copy, status pill, primary CTA, secondary anchor.
- `DashboardTour.astro` — text-only dashboard explanation + repeated CTA.
- `ConnectCard.astro` — connection-details card (host/ports/creds/cert) + the 3-tab `mosquitto` snippet, with copy buttons.
- `ProductionCta.astro` — "Ready for production?" cards (+ optional closing CTA).

Interaction logic (status pinger, copy-to-clipboard) is **ported and restyled** from the existing `src/components/LiveDemoCard.astro` — reuse the behavior, not its Starlight styling.

## Behavior (client JS)

- **Status pill:** `fetch('https://demo.tbmq.io', { mode: 'no-cors' })` → on success mark Online, on failure Offline (ported from `LiveDemoCard`).
- **Copy buttons:** `navigator.clipboard.writeText(...)` with a transient ✓ confirmation (ported).

Both are progressive enhancements; the page is fully readable with JS disabled (status pill defaults to a neutral "Checking" state; connection values are visible as text).

## Design system / styling

- Marketing typography mixins + CSS custom properties (`var(--color-*)`), **theme-aware** where applicable, matching `/performance/`.
- **Do not** use Starlight `--sl-color-*` variables (undefined outside docs — the reason `LiveDemoCard` can't be reused verbatim).
- Visual language consistent with the other new marketing pages (`/performance/`, `/installations/`).

## Integration & wiring (all additive / TBMQ-local — merge-safe)

Precise touchpoints, following exactly what the `/performance/` commit (`b30f8cff8`) did:

1. **`src/data/navigation.ts`** — repoint the "Live Demo" item from the external `https://demo.tbmq.io/signup` (with `target: '_blank'`) to internal `href: '/live-demo/'` (drop `target`).
2. **`src/util/ogContext.ts`** — add `/live-demo/` to `MARKETING_ALLOWLIST` so an OG card is generated.
3. **`src/components/Landing/HeaderContent.astro`** — add `#live-demo` to the same selector lists `#performance` appears in:
   - always-solid-header box-shadow list
   - non-transparent-header divider/button list
   - opened-burger (mobile) list
   - hide search/theme-toggle list
   - the `$no-dark-pages` SCSS variable (force-light scope)
4. **`src/pages/open-graph/_shared/marketing-meta.ts`** — verify the OG slab/eyebrow/title derived for `/live-demo/` reads well (it currently falls through to the `'Solutions'` standalone section). Add a `MarketingOverride` / prefix entry only if the derived text is poor.

No redirect is required — `/live-demo/` is a brand-new path, and the only inbound reference (the nav) is updated in step 1.

## Non-goals

- **Do not** modify or remove the docs live-demo page (`src/content/_includes/docs/mqtt-broker/installation/live-demo.mdx` and its CE/PE stubs) — docs readers still need it.
- **No** fabricated or mocked dashboard screenshots.
- **No** changes to shared upstream files (Products enum, versions, sidebar, redirects, schemas).
- **No** new dynamic redirect rules.

## Verification

- `pnpm build:fast` succeeds; `/live-demo/` renders in `dist`.
- `pnpm lint:linkcheck` green (new internal links: PE install, pricing, cert download; nav link resolves).
- Manual: nav "Live Demo" navigates to `/live-demo/` in-tab; primary CTA opens `demo.tbmq.io/signup` in a new tab; status pill resolves; copy buttons work; page renders correctly in both light and dark OS settings (force-light behaves like `/performance/`).
- OG card generated for `/live-demo/` (full build, not `build:fast`).

## Merge-safety summary

New files: `src/pages/live-demo.astro`, `src/components/LiveDemo/*`. Edited TBMQ-local files: `navigation.ts`, `ogContext.ts`, `HeaderContent.astro`, `marketing-meta.ts` — all of which the `/performance/` page already established as the marketing-page wiring surface. Nothing here touches the upstream-shared files.
