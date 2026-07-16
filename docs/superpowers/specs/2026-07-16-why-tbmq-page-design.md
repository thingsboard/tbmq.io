# Design Spec: `/product/` — "Why TBMQ" landing page

**Date:** 2026-07-16
**Status:** Approved (design), pending implementation plan
**Author:** dlandiak (with Claude Code)

## 1. Purpose

Add a dedicated, indexable **product page** at `/product/` that tells TBMQ's
engineering credibility story — *how the broker works and why it scales* —
rather than repeating the homepage's feature wall and CE/PE comparison.

This is item **P0 #2 ("Product / Why TBMQ")** from the site gap-analysis memo
(`tbmq-page-gap-analysis`, 2026-07-14). It is the first real product surface
beyond the homepage, and the alternative/comparison pages planned later
(Mosquitto-alternative, AWS IoT Core alternative, "vs" pages) will link into
it.

### Target search intent

"distributed mqtt broker", "scalable mqtt broker", "high availability mqtt
broker", "mqtt broker architecture". The homepage does not rank strongly for
these because it leads with features, not architecture.

### Why it is differentiated from the homepage

The homepage already covers: core strengths, fan-in/fan-out/p2p scenarios,
installation options, client-management UI features, the CE/PE comparison
table, and a features grid. It does **not** explain *how* TBMQ achieves its
numbers — the architecture that makes no-message-loss, at-scale subscription
matching, and horizontal scale possible. That gap is this page's reason to
exist. The source narrative already exists in docs form at
`src/content/_includes/docs/mqtt-broker/why-tbmq.mdx`; this page adapts it into
a visual marketing landing and links to the docs for depth (keeping it
marketing-framed to avoid cannibalizing docs SEO).

## 2. Scope

### In scope

- New page `src/pages/product/index.astro` (slug `/product/`).
- New section components under `src/components/Product/`.
- SEO: title, description, `marketingJsonLd`, `ogImageAlt`, and adding
  `/product/` to `MARKETING_ALLOWLIST`.
- Reuse of existing repo assets (traffic-pattern SVGs, architecture diagram).

### Out of scope

- **Navigation changes.** Per the prior decision ("keep proven top-level; add
  dropdowns only when a cluster populates"), the top nav is left unchanged.
  `/product/` is reachable and indexable regardless; it will be linked from
  page CTAs and, later, from the comparison/alternative pages. A nav entry can
  be added once the "Product" cluster justifies it.
- The architecture **deep dive** (persistent client internals, Redis/Kafka
  specifics) — link to `/docs/mqtt-broker/architecture/` instead.
- Any fabricated claims (customers, compliance, benchmarks not already
  published). All numbers come from the existing docs perf-test reports.

## 3. Page shell & conventions

Mirror the existing marketing landings (`/performance/`, `/live-demo/`):

- `BaseLayout` with `forceLightTheme`, `pageId="product"`,
  `gitHubPlatform={Products.TBMQ}`.
- Accent: `:global(#product) { --tb-main-color: #{$color-pe};
  --tb-main-color-hover: #{$color-pe-dark}; }` in a scoped `<style lang="scss">`
  block (same as `/performance/`).
- Section components imported into the page `<main>`, one per section.
- SCSS uses relative `@use '../../styles/variables' as *;` (component depth) or
  `../styles/variables` (page depth), matching sibling files.
- Typography via the shared mixins in `_variables.scss` — no hardcoded font
  values. Theme-dependent colors via CSS custom properties, not compile-time
  SCSS color vars.

## 4. Sections

Content is adapted (rewritten for marketing, not copied verbatim) from
`why-tbmq.mdx`. Each section is one component.

### 4.1 `ProductHero.astro`

- **Headline:** positioning statement, e.g. "The MQTT broker built for real IoT
  traffic" (final copy TBD in implementation, kept keyword-aware:
  distributed / scalable / architecture).
- **Sub-line:** one sentence of "what is TBMQ" so newcomers are oriented — an
  MQTT broker built by the ThingsBoard team from years of operating IoT
  infrastructure at scale.
- **Stat strip** (3 stats, same visual grammar as the Performance hero):
  - `3M+ msg/sec` — single-node throughput
  - `100M` — concurrent connections (cluster)
  - `Zero message loss` — by design
  Each stat links to its proof: throughput → the 3M perf-test doc; connections
  → the 100M perf-test doc; message loss → the on-page architecture section
  (anchor to `ArchitecturePillars`).
- **CTAs:** primary `[Try it now]` → `/installations/`; secondary `[Live demo]`
  → `/live-demo/`.

### 4.2 `TrafficPatterns.astro` — "Purpose-built for IoT traffic"

- Lead paragraph: IoT traffic is not uniform; most brokers treat all traffic
  the same, TBMQ gives each pattern a dedicated processing path.
- Three items using the existing SVGs
  (`src/assets/images/landings/mqtt-broker/{fan-in,fan-out,p2p}.svg`):
  - **Fan-in** — millions of devices publish; a few apps must consume every
    message in order, even during spikes/outages.
  - **Fan-out** — one message must reach many subscribers simultaneously.
  - **Point-to-point** — targeted, low-latency command/response.
- Framed as *why the architecture exists* (sets up section 4.3), NOT as a
  restatement of the homepage `ScenariosSection`. Keep copy short; the homepage
  covers the pattern mechanics, this page uses them to motivate the design.

### 4.3 `ArchitecturePillars.astro` — "Architecture that backs the numbers"

- Four pillar cards, adapted from the `why-tbmq.mdx` "Architecture" section:
  1. **No message loss by design** — no PUBACK/PUBREC until Kafka has durably
     stored the message; another node resumes from Kafka on crash.
  2. **Subscription matching at any scale** — subscriptions in an in-memory
     Trie; lookup is proportional to topic length, not subscription count.
  3. **Separate paths for publishers and subscribers** — DEVICE clients
     (Redis-backed) vs APPLICATION clients (dedicated Kafka topic + consumer
     thread); a device spike never delays application delivery.
  4. **Symmetric cluster, no coordinator** — identical masterless nodes, shared
     state via Kafka, new nodes auto-join and rebalance with no downtime.
- **Visual:** the existing docs diagram
  `src/assets/images/docs/mqtt-broker/architecture/tbmq-architecture.png`
  (clean, light-background, on-brand green; shows Devices/Applications → Netty →
  Message Dispatcher → Kafka + Actor System + Subscription Trie). Rendered via
  the standard optimized-image approach (e.g. `SmartImage`/`DocImage` pattern
  used elsewhere), with descriptive `alt`.
- Closing link: "See the full architecture" → `/docs/mqtt-broker/architecture/`.

### 4.4 `BuiltOn.astro` — "Built on proven foundations"

- Four compact items, one line of *why* each:
  - **Apache Kafka** — durable message storage and distribution.
  - **Netty** — non-blocking network transport.
  - **Actor system** — per-client concurrency isolation.
  - **Trie** — in-memory subscription matching.
- Optional: link Kafka/Netty to their upstream sites (external links, as the
  docs do).

### 4.5 `Compliance.astro` — "Full MQTT compliance + capabilities"

- MQTT version support: 3.1 / 3.1.1 / 5.0 (badges or a short row), noting full
  compliance in both single-node and cluster mode.
- **Compact** capability summary (a short list, not the homepage's full grid):
  cluster support, X.509 / JWT / HTTP auth, ACL, REST API, rate limiting,
  metrics, WebSocket client, HTTP/MQTT/Kafka integrations, backpressure,
  blocked/unauthorized client management.
- **Honest CE/PE note:** PE-only extras (SSO, RBAC, white labeling) flagged as
  Professional Edition, with a link to the homepage comparison
  (`/#comparison-features`) or `/pricing/`. Do not imply PE features are free.

### 4.6 `ProductCta.astro` — closing CTA

- Two actions: primary `[Get started]` → `/docs/mqtt-broker/getting-started/`
  (CE, matching the open-source-front-door decision); secondary
  `[Read the architecture]` → `/docs/mqtt-broker/architecture/`.

## 5. SEO

Same treatment applied to `/performance/` and `/live-demo/`:

- **Title** (keyword-front-loaded, working draft):
  `Distributed MQTT Broker Architecture – Built to Scale`
  Resolves via `formatMarketingTitle` to `… | TBMQ`.
- **Description** (~150–160 chars, working draft): explains purpose-built
  architecture, 3M msg/sec, 100M connections, no message loss — final wording
  in implementation.
- **JSON-LD:** `marketingJsonLd({ path: '/product/', name: title, description,
  breadcrumb: 'Product' })` → WebPage + BreadcrumbList.
- **`ogImageAlt`:** descriptive alt for the OG card.
- **OG allowlist:** add `'/product/'` to `MARKETING_ALLOWLIST` in
  `src/util/ogContext.ts` so a per-page OG card is generated.

## 6. Merge-safety

Everything is additive:

- New files under `src/pages/product/` and `src/components/Product/`.
- One line added to `MARKETING_ALLOWLIST`.

No shared upstream files are restructured (Products enum, `versions.ts`,
`astro.sidebar.ts`, redirect tables, content schemas are all untouched). This
keeps the repo merge-compatible with the upstream ThingsBoard site.

## 7. Success criteria

- `/product/` builds and renders with all six sections.
- `pnpm build:fast` passes; `pnpm lint:linkcheck` clean (new internal links to
  docs, live-demo, installations resolve).
- Rendered HTML shows: correct `<title>` (`… | TBMQ`), meta description,
  canonical, JSON-LD (WebPage + BreadcrumbList), `og:image:alt`, per-page OG
  image generated.
- Page is visually consistent with `/performance/` and `/live-demo/`
  (forceLightTheme, PE-green accent, shared typography).
- No content duplicates the homepage verbatim; architecture depth links to
  docs rather than restating them.
- CE/PE distinctions are honest (PE-only features clearly flagged).

## 8. Testing / verification

- Build: `pnpm build:fast` (ask before running, per project policy).
- Link check: `pnpm lint:linkcheck`.
- Type/lint: `pnpm check`, `pnpm lint:eslint`.
- Manual: view `/product/` in `pnpm dev`, confirm section order, diagram
  renders, CTAs navigate correctly, responsive at mobile/desktop. (Page uses
  `forceLightTheme`, so there is no dark variant to check — same as
  `/performance/` and `/live-demo/`.)
