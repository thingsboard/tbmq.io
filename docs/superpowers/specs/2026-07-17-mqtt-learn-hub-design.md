# MQTT Learn Hub — Design Spec

**Date:** 2026-07-17
**Status:** Approved (brainstorm) — pending spec review
**Owner:** dlandiak

## 1. Overview

Build a marketing-framed **MQTT learn / glossary hub** at `/mqtt/…` — a top-of-funnel SEO engine (the pattern HiveMQ's "MQTT Essentials" uses as its top organic driver). Content is educational but conversion-oriented: every page ties an MQTT concept to a concrete TBMQ strength and links *into* the docs for depth, so the hub does **not** cannibalize the reference documentation.

A new **"Learn"** dropdown is added to the top navigation, immediately after **Company**.

### Goals

- A hub page plus 11 topic pages under `/mqtt/`, forming a hub-and-spoke internal-linking structure.
- One reusable, single-column, marketing-styled topic template.
- Clear separation from docs: Learn = top-of-funnel (benefit-framed), Docs = reference.
- Ship-ready SEO: OG cards, Article + FAQPage + BreadcrumbList JSON-LD, sitemap inclusion.

### Non-goals (this deliverable)

- Deep bodies for the 8 scaffold pages (short-form only now; deepened later).
- Custom illustrations/diagrams beyond what the 3 flagships need.
- `uk` translations (English-only, consistent with the rest of the site).
- Blog cross-linking, tutorials, or non-MQTT "Learn" content.

## 2. Scope of this deliverable

Chosen build scope: **system + 3 flagship articles, other 8 scaffolded.**

- **System (all built now):** hub page, `Learn` dropdown wired to all 11 topics, reusable template + shared components, data registry, SEO plumbing.
- **Flagship pages — full content:** `what-is-mqtt`, `mqtt-vs-kafka`, `shared-subscriptions`.
- **Scaffold pages — short-form (~250–350 words), complete and shippable:** `qos`, `mqtt-5`, `persistent-session`, `topics`, `retained-messages`, `last-will`, `security`, `websocket`.

## 3. Information architecture

```
/mqtt/                        Hub — hero + intro + topic grid (all 11 topics)
/mqtt/what-is-mqtt/           ★ flagship · the anchor; links to every spoke
/mqtt/mqtt-vs-kafka/          ★ flagship
/mqtt/shared-subscriptions/   ★ flagship
/mqtt/qos/                    marquee · short
/mqtt/mqtt-5/                 marquee · short
/mqtt/persistent-session/     marquee · short
/mqtt/topics/                 short
/mqtt/retained-messages/      short
/mqtt/last-will/              short
/mqtt/security/               short
/mqtt/websocket/              short
```

"Marquee" topics (6) appear in the `Learn` dropdown; all 11 appear on the hub grid.

## 4. Content model — single source of truth

**`src/data/mqttLearn.ts`** (new). One array drives the hub grid, the Learn dropdown, related-topics, breadcrumbs, and per-page SEO.

```ts
export interface MqttTopic {
  slug: string;            // 'what-is-mqtt' → /mqtt/what-is-mqtt/
  title: string;           // H1 + <title>
  navLabel: string;        // short label for dropdown / grid card
  eyebrow: string;         // hero eyebrow, e.g. 'MQTT GUIDE'
  quickAnswer: string;     // 2–3 sentence boxed definition (snippet target)
  tbmqTieIn: string;       // one-line "how TBMQ relates" summary (grid + block)
  related: string[];       // slugs for the related-topics grid
  marquee: boolean;        // show in the Learn dropdown
  status: 'full' | 'short';
  seoDescription: string;  // meta description
}
export const mqttTopics: MqttTopic[];
export function getTopic(slug: string): MqttTopic;
export function relatedTopics(slug: string): MqttTopic[];
export const marqueeTopics: MqttTopic[]; // derived, for the dropdown
```

### Per-topic registry (title + TBMQ tie-in)

| slug | title | marquee | status | TBMQ tie-in |
|---|---|:--:|:--:|---|
| what-is-mqtt | What Is MQTT? A Beginner's Guide | ★ | full | TBMQ is an open-source MQTT broker (3.1/3.1.1/5.0) built to scale to 100M+ connections |
| mqtt-vs-kafka | MQTT vs Kafka: Differences & When to Use Each | ★ | full | TBMQ is Kafka-backed internally and bridges MQTT ⇄ Kafka |
| shared-subscriptions | MQTT Shared Subscriptions Explained | ★ | full | TBMQ supports shared subscriptions; APPLICATION clients scale consumers via dedicated Kafka topics |
| qos | MQTT QoS 0, 1 & 2 Explained | ★ | short | Zero message loss — TBMQ acks only after Kafka persists |
| mqtt-5 | MQTT 5.0: What's New | ★ | short | Full MQTT 5.0 support (reason codes, topic aliases, session/message expiry, flow control) |
| persistent-session | MQTT Persistent Sessions & Clean Start | ★ | short | Persistent DEVICE (Redis) vs APPLICATION (dedicated Kafka topic) client model |
| topics | MQTT Topics & Wildcards | | short | In-memory subscription trie — match cost independent of subscriber count |
| retained-messages | MQTT Retained Messages | | short | TBMQ retained-message store |
| last-will | MQTT Last Will & Testament (LWT) | | short | TBMQ LWT support |
| security | MQTT Security: TLS & Authentication | | short | TBMQ auth: mTLS, Basic, JWT, SCRAM |
| websocket | MQTT over WebSocket | | short | In-browser WebSocket client + live demo |

## 5. Page template & components

All under **`src/components/MqttLearn/`**, styled with the site's SCSS design tokens (`src/styles/_variables.scss`) — light-theme-consistent, responsive, matching `/product/`. Single-column layout (chosen).

**`MqttTopicLayout.astro`** — the reusable template. Props: `slug` (looks up the registry). Renders, top to bottom:

1. **Breadcrumb** — Home › Learn › {title}
2. **Hero** — eyebrow + H1 + one-line definition
3. **Quick-answer box** (`QuickAnswer.astro`) — the boxed 2–3 sentence definition (featured-snippet / AI-answer target)
4. **Body** — `<slot />` for page-specific content (sections, tables, diagrams)
5. **"How TBMQ handles this"** (`HowTbmqBlock.astro`) — green accent block, from `tbmqTieIn`, with links to `/product/` and relevant docs (the differentiator + anti-cannibalization device)
6. **FAQ** (`FaqAccordion.astro`) — accordion; emits `FAQPage` JSON-LD. FAQ items passed as a prop.
7. **Related topics** (`RelatedTopics.astro`) — card grid from `related[]`
8. **CTA band** (`LearnCta.astro`) — "Try TBMQ" / "Live demo"

Supporting components: `QuickAnswer.astro`, `HowTbmqBlock.astro`, `FaqAccordion.astro`, `RelatedTopics.astro`, `LearnCta.astro`, and `TopicGrid.astro` (hub grid card list from the registry).

**Isolation:** each component has one job and reads from the registry or its props; the layout composes them. A page author only writes the body slot + an FAQ array.

## 6. Pages

One thin `.astro` per topic under **`src/pages/mqtt/`**, each importing `MqttTopicLayout` and filling the body slot + FAQ.

**`index.astro` (hub):** `BaseLayout` + hero (what the hub is) + short intro + `TopicGrid` (all 11) + CTA.

### Flagship bodies (full)

**what-is-mqtt** — How MQTT works (pub/sub vs request/response, broker, clients, topics); Why MQTT for IoT; MQTT vs HTTP (brief, links to mqtt-vs-kafka); **Core MQTT concepts** — short blurbs each linking to its spoke (QoS, topics, retained, LWT, persistent sessions, MQTT 5, shared subs, security) — this is the hub-linking engine. FAQ: what MQTT stands for, is it open, ports 1883/8883, is it secure, what a broker is.

**mqtt-vs-kafka** — What each is for (edge/device connectivity vs backend event log); comparison table (model, delivery guarantees, ordering, retention/replay, client scale, connectivity, typical use); when to use which; **use them together** (MQTT at the edge → broker → Kafka; TBMQ is Kafka-backed and bridges them). FAQ: can MQTT replace Kafka, does Kafka speak MQTT, how to connect MQTT→Kafka, which is faster.

**shared-subscriptions** — The problem (normal subs fan out to all; no load balancing); how shared subs work with `$share/{group}/{topic}` + example; MQTT 3.1.1 vs 5.0; use cases (worker pools, high-throughput ingestion); gotchas (ordering, QoS). FAQ: what `$share` is, broker support, 5.0 vs 3.1.1, round-robin distribution.

### Scaffold body (short) — shared shape

quickAnswer (expanded to a short intro) → 1 "why it matters" paragraph → `HowTbmqBlock` → related → CTA. ~250–350 words. **Indexed** (default decision). If thin-content SEO becomes a concern, add an optional `noindex` flag to the registry later — not in this deliverable.

## 7. Navigation

**`src/data/navigation.ts`** (edit):
- Insert `{ label: 'Learn', submenuId: 'nav-learn' }` into `mainNavItems` immediately after the `Company` item.
- Add `learnSubmenu: SubMenu` (id `nav-learn`): group 1 = hub link ("MQTT Guide — start here"); group 2 = the 6 marquee topics; a trailing "Browse all guides →" link to `/mqtt/`.
- Add `learnSubmenu` to `allSubmenus`.

Reuses the existing submenu rendering (`HeaderContent.astro` / `Navigation.astro`) — no new nav component. Verify the renderer tolerates submenu items without an `icon` (or supply a shared icon).

## 8. SEO & anti-cannibalization

- **`src/util/ogContext.ts`** (edit): add `'/mqtt/*'` to `MARKETING_ALLOWLIST` so per-page OG cards generate; add eyebrow/label mapping if needed.
- **Structured data:** `Article` + `BreadcrumbList` per page via the existing `marketingJsonLd` helper (`src/util/structuredData`); `FAQPage` emitted by `FaqAccordion`.
- **Sitemap:** automatic (new pages under `src/pages/`).
- **Anti-cannibalization strategy:** marketing intent — benefit-framed, conversational, "why it matters," *not* configuration/reference. Every page links into docs for depth ("See the full docs →"). This keeps Learn (informational, top-of-funnel) and Docs (reference) targeting different search intent.

## 9. File inventory

**New**
- `src/data/mqttLearn.ts`
- `src/components/MqttLearn/MqttTopicLayout.astro`
- `src/components/MqttLearn/QuickAnswer.astro`
- `src/components/MqttLearn/HowTbmqBlock.astro`
- `src/components/MqttLearn/FaqAccordion.astro`
- `src/components/MqttLearn/RelatedTopics.astro`
- `src/components/MqttLearn/LearnCta.astro`
- `src/components/MqttLearn/TopicGrid.astro`
- `src/pages/mqtt/index.astro`
- `src/pages/mqtt/{what-is-mqtt,mqtt-vs-kafka,shared-subscriptions}.astro` (full)
- `src/pages/mqtt/{qos,mqtt-5,persistent-session,topics,retained-messages,last-will,security,websocket}.astro` (short)

**Edited**
- `src/data/navigation.ts` — Learn item + `learnSubmenu`
- `src/util/ogContext.ts` — `/mqtt/*` in `MARKETING_ALLOWLIST`

## 10. Verification

- `pnpm check` (astro), `pnpm lint:eslint`, `pnpm lint:slugcheck`.
- `pnpm lint:linkcheck` — new pages, nav links, related-topics links, docs links (required: pages added + internal links changed).
- `pnpm build:fast` — production build.
- Visual verification (headless Chrome screenshots): hub, one flagship, and the Learn dropdown, at desktop + mobile.

## 11. Open decisions (resolved)

- **Scaffold indexing:** indexed (short-form is genuinely useful). A `noindex` toggle can be added to the registry later if thin-content proves a problem.
- **Nav behavior/label:** curated dropdown, labelled "Learn".
- **Template:** single column.
