# MQTT Learn — Topic-Authoring Skill + Batch 2 Guides — Design Spec

**Date:** 2026-07-20
**Status:** Approved (brainstorm) — pending spec review
**Owner:** dlandiak

## 1. Overview

Two linked deliverables that build on the shipped `/mqtt` learn hub:

1. A **project-scoped skill** (`.claude/skills/mqtt-learn-topic/SKILL.md`) that codifies how to add a new `/mqtt` learn topic end to end — registry entry, the auto-derived Learn nav, a **comprehensive spec-based guide page**, TBMQ practical notes + links into `/docs`, an ASCII diagram where it aids understanding, and the verification gates. It bakes in the content-accuracy discipline learned during batch 1 (verify every TBMQ product claim against source/docs).
2. A **second batch of 6 comprehensive topic guides**, authored *using* that skill (dogfooding): `mqtt-broker`, `mqtt-client`, `keep-alive`, `mqtt-vs-http`, `mqtt-vs-amqp`, `mqtt-vs-coap`.

Plus one small enabling component: a reusable `AsciiDiagram.astro` so ASCII diagrams render cleanly and can later be swapped for Claude Design HTML diagrams.

### Goals
- A repeatable, self-contained skill so any contributor (or a future agent) can add an on-brand, accurate `/mqtt` topic.
- 6 new full guides that deepen the hub-and-spoke and target high-intent search terms.
- A clean seam (`AsciiDiagram`) for later diagram upgrades.

### Non-goals (this deliverable)
- Deepening the existing 8 short-form scaffolds (separate follow-up).
- Custom Claude Design HTML diagrams (ASCII now; swap later).
- Sparkplug / industrial topics (deferred; needs TBMQ-support verification first).
- `uk` translations (English-only, consistent with the site).

## 2. The skill — `.claude/skills/mqtt-learn-topic/SKILL.md`

A single comprehensive `SKILL.md` matching the `docs@thingsboard-tools` house style (YAML frontmatter `name` + `description`, then a full reference). "Project scope" = committed to this repo under `.claude/skills/`.

Frontmatter `description` (triggering): reference for adding/editing a topic on the `/mqtt` learn hub — registry entry, Learn nav, a comprehensive spec-based guide with TBMQ practical notes, `/docs` links, and an ASCII diagram.

Sections:
1. **Overview & principles** — what the hub is; marketing-framed, benefit-first; anti-cannibalization (link *into* `/docs` for depth, don't duplicate reference material).
2. **File map** — `src/data/mqttLearn.ts` (registry + helpers), `src/components/MqttLearn/*` (layout + leaves + `AsciiDiagram`), `src/pages/mqtt/*` (hub + topic pages). Nav is **auto-derived** from `marqueeTopics` in `src/data/navigation.ts` — no manual nav edit to add a topic; only the `marquee` flag matters.
3. **Add a topic, step by step:**
   - a. Add a `MqttTopic` entry to `src/data/mqttLearn.ts` — full field spec (`slug`, `title`, `navLabel`, `eyebrow`, `quickAnswer`, `tbmqTieIn`, `related`, `marquee`, `status`, `seoDescription`) and rules: `slug` = page filename; every `related[]` slug must resolve; `marquee: true` adds it to the Learn dropdown (keep curated); `status: 'full'` for comprehensive guides.
   - b. Create `src/pages/mqtt/<slug>.astro` on `MqttTopicLayout` with the comprehensive-guide body (§3-skill / this spec §4) + a `faq` array (3–5 items → FAQPage JSON-LD).
   - c. Add the new slug into related existing topics' `related[]` and, where natural, add an in-body link from a high-traffic page (hub-and-spoke).
4. **Comprehensive-guide content model** (§4 below) — the required body skeleton.
5. **Diagram convention** (§5 below) — `AsciiDiagram` usage + authoring rules + the "swap for Claude Design later" note.
6. **Content-accuracy rules (mandatory):** protocol statements must match the MQTT spec (3.1.1 / 5.0); **every TBMQ product claim must be verified** against `~/projects/tbmq` source or the shipped `/docs/mqtt-broker/…`. Cite batch-1 gotchas as cautionary examples: WebSocket ports (8083 is TBMQ's HTTP/UI port; WS/WSS are 8084/8085), QoS durability (TBMQ default `acks=1` / `replication.factor=1` — don't claim "never lost" unconditionally), MQTT retention (retain = last value, not a replay log).
7. **`/docs` linking** — link to the relevant `/docs/mqtt-broker/…` page(s) for depth in the body and/or via `HowTbmqBlock`.
8. **Verification gates** with exact commands: `pnpm check`, `pnpm lint:eslint`, `pnpm lint:slugcheck`, render curl (`curl -s localhost:4321/mqtt/<slug>/`), `pnpm lint:linkcheck`, `pnpm build:fast` (ask before building), headless-Chrome visual QA.
9. **Format gotchas** — tabs in code files; in JSX bodies write `&lt;`/`&gt;`/`&amp;`; internal links use trailing-slash `/mqtt/<slug>/`; run `pnpm format` (or targeted `prettier --write`) on touched files.

## 3. Enabling component — `src/components/MqttLearn/AsciiDiagram.astro`

Renders a monospaced, horizontally-scrollable diagram block with an optional caption. Props: `content: string` (the ASCII, passed as a JS template literal from page frontmatter to avoid JSX parsing of `<`/`>`/`|`), `caption?: string`, `label?: string` (aria-label). Markup: `<figure class="ascii-diagram"><pre>{content}</pre>{caption && <figcaption>…</figcaption>}</figure>`. Scoped SCSS: `$font-family-mono`, small size, `$color-bg-light` bg, `$color-border` border, radius, padding, `overflow-x: auto`. A top-of-file comment marks it as the **swap seam**: replace the `<AsciiDiagram … />` usage with a Claude Design HTML diagram component later without touching page prose.

Authoring rule (documented in the skill): define the diagram as a `const … = \`…\`` template literal in the page frontmatter and pass via `content={…}`; avoid backticks and `${` inside the ASCII.

## 4. Comprehensive-guide content model

Fuller than batch-1 flagships. Body skeleton (semantic HTML in the `<slot />`; the layout supplies breadcrumb/hero/QuickAnswer/HowTbmqBlock/related/CTA):

1. **Intro** — 1 short paragraph of context.
2. **How it works** — spec-accurate explanation of the mechanism (protocol packets, roles, sequence).
3. **Diagram** — `<AsciiDiagram>` where it aids understanding (broker fan-out, connection/ping timeline, request/response-vs-pub/sub, etc.).
4. **At-a-glance** — a table or list; **required for the comparison topics** (feature-by-feature table).
5. **TBMQ in practice** — in-body practical notes + explicit `/docs/mqtt-broker/…` links (the "How TBMQ handles this" block also auto-renders from `tbmqTieIn`).
6. **FAQ** — 3–5 Q/A (plain-text answers; renders FAQPage JSON-LD).

## 5. The 6 topics

All `status: 'full'`, `eyebrow: 'MQTT GUIDE'` except comparisons use `'MQTT COMPARISON'`.

| slug | title (H1) | navLabel | marquee | diagram | related[] |
|---|---|---|:--:|---|---|
| `mqtt-broker` | What Is an MQTT Broker? | MQTT broker | ★ | broker fan-out: publishers → broker → subscribers | what-is-mqtt, mqtt-client, mqtt-vs-kafka |
| `mqtt-client` | What Is an MQTT Client? | MQTT client | | client ↔ broker CONNECT/CONNACK + pub/sub roles | mqtt-broker, what-is-mqtt, websocket |
| `keep-alive` | MQTT Keep-Alive and Ping | Keep-alive | | PINGREQ/PINGRESP timeline + keep-alive interval / 1.5× timeout | persistent-session, last-will, mqtt-client |
| `mqtt-vs-http` | MQTT vs HTTP | MQTT vs HTTP | | request/response vs pub/sub + comparison table | what-is-mqtt, mqtt-vs-kafka, mqtt-client |
| `mqtt-vs-amqp` | MQTT vs AMQP | MQTT vs AMQP | | comparison table | mqtt-vs-kafka, mqtt-vs-http, what-is-mqtt |
| `mqtt-vs-coap` | MQTT vs CoAP | MQTT vs CoAP | | comparison table | mqtt-vs-http, what-is-mqtt, qos |

TBMQ tie-in intent (exact copy verified during implementation):
- `mqtt-broker` — TBMQ is an open-source MQTT broker (3.1/3.1.1/5.0) built to scale to 100M+ connections; links to getting-started + architecture docs.
- `mqtt-client` — TBMQ ships a built-in WebSocket MQTT client and works with any standard client library; links to the WS client docs.
- `keep-alive` — TBMQ tracks keep-alive per connection and publishes Last Will on timeout.
- comparisons — TBMQ is a purpose-built MQTT broker for massive device fleets; MQTT↔Kafka bridge already covered in the mqtt-vs-kafka flagship.

**Marquee change:** add `mqtt-broker` to `marquee` (Learn dropdown → 7 items). Others stay off to keep it curated.

## 6. Wiring into existing pages (hub-and-spoke)
- `what-is-mqtt`: add `mqtt-broker` to `related[]` (trim to keep the grid tidy); in the "MQTT vs HTTP" body section, add a link to the new `/mqtt/mqtt-vs-http/`; in "Core MQTT concepts", link `mqtt-broker` / `mqtt-client`.
- `mqtt-vs-kafka`: add `mqtt-vs-http` to `related[]`.
- `websocket`: already relates to `mqtt-client` conceptually — add to its `related[]` if it improves the grid.
Every `related[]` edit keeps arrays at 3–4 entries and must resolve.

## 7. SEO
- Per-page `WebPage` + `BreadcrumbList` JSON-LD (existing `marketingJsonLd`), `FAQPage` from the FAQ, sitemap automatic. `/mqtt/*` already in `MARKETING_ALLOWLIST` (OG cards) and `#mqtt-learn` header styling already applies — no new wiring.
- Comparison pages target high-volume "X vs Y" intent; foundational pages target "what is an mqtt broker/client".

## 8. File inventory
**New**
- `.claude/skills/mqtt-learn-topic/SKILL.md`
- `src/components/MqttLearn/AsciiDiagram.astro`
- `src/pages/mqtt/{mqtt-broker,mqtt-client,keep-alive,mqtt-vs-http,mqtt-vs-amqp,mqtt-vs-coap}.astro`

**Edited**
- `src/data/mqttLearn.ts` — 6 new registry entries + `related[]` updates on existing topics
- `src/pages/mqtt/what-is-mqtt.astro` — in-body links to new pages (mqtt-vs-http, broker/client)

No nav edit needed (dropdown auto-derives from `marqueeTopics`).

## 9. Verification
`pnpm check` · `pnpm lint:eslint` · `pnpm lint:slugcheck` · `pnpm lint:linkcheck` · `pnpm build:fast` (ask first) · render curl per page · headless-Chrome visual QA (one new guide + the dropdown showing MQTT broker). Content-accuracy review on every page, verifying TBMQ claims against `~/projects/tbmq` / `/docs`.

## 10. Open decisions (resolved)
- **Skill location:** repo `.claude/skills/mqtt-learn-topic/` (project scope), single `SKILL.md`.
- **Diagram handling:** reusable `AsciiDiagram.astro` (clean swap seam).
- **Marquee:** add `mqtt-broker` to the dropdown; other 5 stay off.
- **Topic depth:** all 6 are full comprehensive guides (`status: 'full'`).
