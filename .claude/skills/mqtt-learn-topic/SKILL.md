---
name: mqtt-learn-topic
description: Adds or edits topics on the /mqtt learn hub — TBMQ's marketing MQTT guides at /mqtt/<slug>/ — covering the topic registry entry, hub category, Learn nav, the spec-accurate guide page with its inline-SVG diagram, and the TBMQ notes that link into /docs. Use when someone wants an MQTT concept, glossary, or "what is X" page, an "MQTT vs Y" protocol comparison, a broker comparison ("<broker> alternative") page, to deepen or fix an existing guide, or to extend the MQTT learn hub, even if they don't name the hub. Not for /docs reference pages, which belong to tbmq-docs-page.
---

# MQTT learn topic

The `/mqtt` learn hub is TBMQ's top-of-funnel SEO surface: educational MQTT guides that each tie a
concept to a concrete TBMQ strength and link *into* the reference docs for depth. This skill adds or
edits one topic without breaking the hub or shipping inaccurate copy.

**Companion skill `tbmq-docs-page`.** Every guide points at a technical counterpart under `/docs/`.
The two never duplicate each other: the learn page teaches the general concept and why it matters
(spec-level, vendor-neutral); the doc covers TBMQ parameters, defaults, behavior and steps. If the
paired doc is missing or thin, that is a `tbmq-docs-page` job.

## Workflow

Copy this checklist and tick it off:

```
- [ ] 1. Pick the page type: guide (below), "X vs Y" or broker comparison (references/comparison-pages.md)
- [ ] 2. Registry entry in src/data/mqttLearn.ts + its category in mqttCategories
- [ ] 3. Page src/pages/mqtt/<slug>.astro following the content model
- [ ] 4. One diagram (references/diagrams.md); lists as content blocks (references/content-blocks.md)
- [ ] 5. Verify every protocol claim against the spec and every TBMQ claim against source (Content accuracy)
- [ ] 6. Wire it in: related[] of neighbouring topics, an in-body link from a high-traffic page
- [ ] 7. Verification checks; after a build, regenerate reading times
```

## Principles

- **Marketing-framed, not reference.** Guides are benefit-first and conversational, so they target *informational* search intent and don't cannibalize `/docs/` (how-to intent). If you are writing configuration steps or a full reference table, stop and link to `/docs` instead.
- **Every guide links its companion doc.** The `<Topic> in TBMQ` section carries an in-body link to the single most relevant `/docs/` page. Link a specific page when one exists — a link to only an adjacent doc (`architecture`, `getting-started`) is still a gap. The bare `/docs/` root is a placeholder, legitimate only when no companion can exist ("MQTT vs AMQP"). MQTT 5 features without a dedicated doc share `/docs/user-guide/mqtt-protocol/`. Always link the **CE** path, never `/docs/pe/…`. Deep anchors are fine (`/docs/security/overview/#authorization`).
- **One registry drives everything.** The hub grid, Learn nav, series rail, related topics, breadcrumbs and per-page SEO all read `src/data/mqttLearn.ts`. A topic is mostly a registry entry plus a thin page.
- **Accuracy is the product.** These are public technical pages under TBMQ's name; a wrong protocol detail or an overstated product claim erodes the trust the funnel depends on. See Content accuracy.

## File map

```
src/data/mqttLearn.ts          ← topic registry, helpers (getTopic, topicHref, relatedTopics, categoryForSlug),
                                 learnNavSlugs/learnNavTopics, hub taxonomy (mqttCategories, mqttCategoryGroups)
src/data/navigation.ts         ← learnSubmenu maps learnNavTopics — never hand-edit the nav markup
scripts/mqtt-reading-time.mjs  ← regenerates every topic's readingMinutes from the built pages
src/components/MqttLearn/
  MqttTopicLayout.astro        ← page template: 3-column shell + client-built scrollspy TOC
  QuickAnswer.astro            ← boxed definition from registry.quickAnswer — PLAIN TEXT, no HTML
  HowTbmqBlock.astro           ← green tie-in rail from registry.tbmqTieIn (fixed links to /product/ + /docs/)
  TopicSeriesNav.astro         ← sidebar rail: every topic in this topic's category
  FaqAccordion.astro           ← accordion + FAQPage JSON-LD; answers render as HTML; exports `FaqItem { q; a }`
  RelatedTopics.astro, LearnCta.astro, TopicGrid.astro (hub grid + filter pills + client search)
  MqttDiagram.astro            ← inline-SVG diagram frame — see references/diagrams.md
  LearnFeatureGrid / LearnCardGrid / LearnIconRows + LearnIconRow / LearnTypeCards ← references/content-blocks.md
  AsciiDiagram.astro           ← legacy, unused — don't reach for it
src/pages/mqtt/index.astro     ← the hub
src/pages/mqtt/<slug>.astro    ← one thin page per topic
```

Existing pages are the best reference. Models by shape: `mqtt-broker.astro` (widest component
use), `qos.astro` (icon rows + table), `what-is-mqtt.astro` (umbrella page), `mqtt-vs-kafka.astro`
(protocol comparison), `mqtt-reason-codes.astro` (page-local `<details>` blocks),
`mosquitto-alternative.astro` (broker comparison).

## Registry entry (`src/data/mqttLearn.ts`)

Add one `MqttTopic` object to `mqttTopics`. Tabs for indentation.

```ts
{
	slug: 'keep-alive',                    // URL /mqtt/keep-alive/ — MUST equal the page filename
	readingMinutes: 4,                     // REQUIRED, but generated — placeholder now, regenerate later
	title: 'MQTT Keep-Alive and Ping',     // H1 + <title> (BaseLayout appends ' | TBMQ')
	navLabel: 'Keep-alive',                // short label: dropdown, hub/related cards, breadcrumb
	cardSummary:                           // REQUIRED. One sentence, ~90–120 chars, the hub-card blurb (2-line clamp)
		'The heartbeat that keeps a connection alive and detects dead peers.',
	// icon: '/src/assets/images/landings/nav/learn-<slug>.svg', // only if the slug is in learnNavSlugs
	eyebrow: 'MQTT GUIDE',                 // or 'MQTT COMPARISON' (X vs Y) / 'BROKER COMPARISON' — the only three values
	quickAnswer:                           // 2–3 sentences, featured-snippet target. PLAIN TEXT ONLY.
		'A self-contained answer to "what is <topic>". The first sentence must stand alone as a definition.',
	tbmqTieIn:                             // ONE verified, specific sentence on how TBMQ relates — no fluff
		'…',
	related: ['persistent-session', 'last-will', 'mqtt-client'], // 3–4 slugs that exist
	status: 'full',                        // 'short' exists in the type but is unused — don't ship a scaffold
	// startHere: true,                    // the single "Start here" badge — taken by what-is-mqtt
	seoDescription:                        // meta description, ~150–160 chars, benefit-framed, includes the key term
		'MQTT keep-alive explained — the PINGREQ/PINGRESP mechanism, the keep-alive interval and 1.5× timeout, and how brokers detect dead clients.',
},
```

Rules:

- **`cardSummary` and `readingMinutes` are required by the `MqttTopic` type** — omit either and `pnpm check` fails. They are the easiest to forget because the page body never uses them. `cardSummary` also feeds the hub search index (`navLabel` + `cardSummary` + category tag), so any term a reader would search for must appear in one of those.
- **Categorize it in `mqttCategories`** — exactly one category; order within it is card order on the hub. Categories: `fundamentals` · `connections` (connections & sessions) · `mqtt-5` · `security` · `comparisons` (transports and "X vs Y" protocol comparisons — a new transport guide such as WebSocket goes here) · `broker-comparisons`. A guard in `mqttLearn.ts` throws when a topic is missing from `mqttCategories`, listed twice, or misspelled — this fails the **build** and the dev page render, not `pnpm check`.
- **Every `related[]` slug must exist** — `getTopic` throws on an unknown one. Keep 3–4.
- **A new category is a three-file change and fails silently:** the `mqttCategories` entry, plus — in **each** of `TopicGrid.astro` and `TopicSeriesNav.astro` — a glyph in that file's `categoryIcon` map and a `.c-<accent>` block. A missing glyph or accent renders an empty `<svg>` and an unstyled rail, with no error. Prefer an existing category.
- **The Learn nav dropdown is curated and short.** To feature a topic, add its slug to `learnNavSlugs` (position = display order) and an `icon`: a 24×24 duotone `currentColor` SVG in `src/assets/images/landings/nav/` (primary fill + a `fill-opacity="0.3"` accent). Then run `pnpm generate:nav-sprite`, or `NavIcon` renders nothing (it only warns). Confirm the topic is headline-worthy first.
- **Wire the hub-and-spoke both ways.** Add the new slug to the `related[]` of the closest topics, and where natural link it from a high-traffic page such as `what-is-mqtt.astro`. Isolated pages don't rank.

**Reading time is generated.** `pnpm generate:reading-time` counts words in the *built* pages
(200 wpm, page chrome excluded) and rewrites `readingMinutes` for every topic. It needs a build
first, so ask the user before running `pnpm build:fast && pnpm generate:reading-time`. Commit the
registry diff it produces, including changes to other topics whose content drifted. Never leave a
hand-invented number in the final commit.

## Guide page (`src/pages/mqtt/<slug>.astro`)

A thin page that fills the layout's slot and passes a FAQ array. Tabs for indentation. In JSX body
text write `&lt;` `&gt;` `&amp;`. Internal links use trailing slashes: `/mqtt/<slug>/`, `/docs/<path>/`.

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
import MqttDiagram from '@components/MqttLearn/MqttDiagram.astro';
import type { FaqItem } from '@components/MqttLearn/FaqAccordion.astro';

const faq: FaqItem[] = [
	{ q: 'What is the MQTT keep-alive interval?', a: 'Prose answer. Inline <code>…</code> for special fields and <strong>…</strong> for the key takeaway are fine; no links.' },
	{ q: 'What happens if a client misses the keep-alive?', a: '...' },
];
---

<MqttTopicLayout slug="keep-alive" faq={faq}>
	<p>One-paragraph intro that leads with the reader's problem.</p>

	<h2>How it works</h2>
	<p>Spec-accurate mechanism — packets, roles, sequence, timers.</p>

	<MqttDiagram caption="Keep-alive ping cycle and dead-client detection">
		<svg viewBox="0 0 680 196" role="img" aria-label="…"><!-- see references/diagrams.md --></svg>
	</MqttDiagram>

	<h2>Keep-alive at a glance</h2>
	<div class="overflow-x">
		<table>…</table>
	</div>

	<h2>Keep-alive in TBMQ</h2>
	<p>Verified TBMQ behavior, then the companion doc: <a href="/docs/user-guide/keep-alive/">keep-alive reference</a>.</p>
</MqttTopicLayout>
```

The layout renders everything around your slot from the registry:

- **Hero:** breadcrumb → eyebrow + reading-time badge → H1 (`title`) → `QuickAnswer`.
- **Left rail:** a scrollspy TOC built client-side from your body's `<h2>`s, then `TopicSeriesNav`. Your `<h2>` text is the TOC label, so keep each short and self-describing; `<h3>`s don't appear.
- **Center:** your body, then the FAQ accordion.
- **Right rail:** `HowTbmqBlock`, sticky, *beside* the body. Its own `<h2>` stays out of the TOC.
- **Foot:** related topics, then the CTA band.

## Content model (guides)

Target **3–4 `<h2>`s**. Comparison and broker-comparison pages have their own shapes in
`references/comparison-pages.md`.

1. **Intro** — one short paragraph before the first `<h2>`, leading with the reader's problem (the QuickAnswer box above already defines the term). An umbrella page whose first section is itself the overview may skip it (`what-is-mqtt`, `shared-subscriptions`).
2. **How it works** — the spec-accurate mechanism. This is the core.
3. **Diagram** — exactly one `<MqttDiagram>`, right after the mechanism.
4. **One or two middle sections**, chosen from the shapes the hub already uses:
   - *At a glance* — a table or tight list, natural for 3+ parallel variants (`qos`, `persistent-session`, `websocket`, `mqtt-packets`).
   - *Version difference* — where 3.1.1 and 5.0 diverge (`Server keep-alive (MQTT 5.0)`, `Before MQTT 5.0`).
   - *Caveats* — what readers get wrong (`Things to keep in mind`, `Uniqueness and client take-over`).
   - *Choosing / best practices* — (`Choosing a level`, `Naming best practices`).
   - *Sub-topic index* — on an umbrella topic, a `LearnCardGrid` of the guides underneath it.
5. **`<Topic> in TBMQ`** — the last `<h2>` (`Keep-alive in TBMQ`, `Clients in TBMQ`). One or two paragraphs naming the verified TBMQ behavior plus the required companion-doc link. A `LearnIconRows` block fits when TBMQ's behavior genuinely splits (DEVICE vs APPLICATION in `persistent-session`). Stay high-level: a concrete value read from source (a Receive Maximum of 1000, a one-week session-expiry cap) is good; a *table* of them belongs in `/docs`. If TBMQ doesn't support the topic (a non-standard transport, an unimplemented feature), say so plainly and point to the closest thing it does offer — the same goes for `tbmqTieIn`. Never imply support you haven't seen in source.
6. **FAQ** — 3–5 real search questions. Prose answers; inline `<code>` / `<strong>` allowed, no links (tags are stripped for the JSON-LD).

Body lists default to the shared content-block components, not bold-lead `<ul>`s — pick one with
`references/content-blocks.md`.

## Content accuracy

- **Protocol claims match the MQTT spec** (3.1.1 / 5.0): ports, QoS semantics, packet names, wildcard rules, version differences — stated precisely and scoped to the version.
- **Completeness, not just correctness.** When reviewing or deepening a topic, audit it against the spec for a *missing* core mechanism, version difference, or edge case. A guide that omits a load-bearing detail is incomplete even if everything it says is true.
- **Every TBMQ claim is verified** against the broker source or the shipped docs (`src/content/_includes/docs/mqtt-broker/`). If you can't verify it, don't claim it.
- **Read the source on the release line, not the working tree.** The CE checkout `../tbmq` usually sits on a feature branch. `git -C ../tbmq fetch -q origin`, then read with `git show origin/main:application/src/main/resources/thingsboard-mqtt-broker.yml` (use the tag `v<TBMQ_VER>` when the claim must hold for what's live today). Learn-hub claims must hold for **CE**; read `../tbmq-pe` `origin/license` only for a sentence explicitly about PE. If a checkout is missing, ask for its path — never state a default you haven't read.
- **Read the comment above a yml key, not just the value.** `MQTT_TOPIC_MAX_SEGMENTS_COUNT:0` means topic depth is *unlimited* by default, not capped at zero.
- **When unsure between two phrasings, pick the one true under TBMQ's default configuration.**
- Plausible-but-wrong claims that have shipped before:
  - **WebSocket ports.** `8083` is HTTP/UI/REST. MQTT over WS is `8084`, WSS `8085`.
  - **QoS durability.** TBMQ acks a QoS 1/2 publish only after Kafka accepts it, but the defaults are `acks=1` / `replication.factor=1`. It survives a TBMQ-node failure; surviving a Kafka-node failure needs a replicated Kafka cluster.
  - **Retain.** The `retain` flag stores the last value, not a replayable history.

## Verification

Dev server: `http://localhost:4321` (`NODE_OPTIONS=--max-old-space-size=8192 pnpm dev` if needed —
the default heap OOMs on hot restart).

```bash
pnpm check                 # 0 errors — catches missing registry fields, NOT a missing category entry
pnpm lint:eslint
pnpm lint:slugcheck
pnpm exec prettier --write src/pages/mqtt/<slug>.astro src/data/mqttLearn.ts   # then --check
curl -s http://localhost:4321/mqtt/<slug>/ | grep -o 'How TBMQ handles this'   # renders, layout wired, category guard passed
curl -s http://localhost:4321/mqtt/<slug>/ | grep -o '"@type":"FAQPage"'        # FAQ JSON-LD present
curl -s http://localhost:4321/mqtt/<slug>/ | grep -oE 'href="/docs/[^"]*"'      # companion doc link, no /docs/mqtt-broker/
curl -s http://localhost:4321/mqtt/ | grep -c 'topic-card'                     # topic reached the hub grid
```

Builds need the user's go-ahead first (repo policy: ask "Run `pnpm build:fast` to verify, or
skip?"). That includes `pnpm lint:linkcheck`, which builds and validates every `/mqtt/` and `/docs/`
link, and `pnpm generate:reading-time`, which reads the build.

For anything user-facing, take a headless-Chrome look at the page and the Learn dropdown at desktop
and mobile width. Check the three rails: the TOC lists your `<h2>`s and highlights on scroll, the
series rail marks the current topic, and the How-TBMQ rail sits beside the body. On the hub, check
the card blurb isn't cut mid-word and the category filter pill shows it.

## Gotchas

- **Docs links are `/docs/…/`, never `/docs/mqtt-broker/…/`** — that segment survives only in the `_includes` directory and image paths, neither of which is a URL.
- **`quickAnswer` is plain text; FAQ answers are HTML.** A `<code>` in `quickAnswer` renders as literal angle brackets. In FAQ strings a bare `<` / `>` / `&` that isn't a tag must be escaped.
- **Wrap every `<table>` in `<div class="overflow-x">`**, or the table breaks horizontal scroll on mobile.
- **`HowTbmqBlock` links are fixed** to `/product/` and `/docs/`; topic-specific doc links go in your body.
- **A page-local `<style lang="scss">`** is allowed only for a bespoke block no shared component covers (as `mqtt-reason-codes` does). Start it with `@use '../../styles/variables' as *;` and use repo tokens, never raw hex. If the shape recurs, promote it to a `MqttLearn/` component.
- **A one-class scoped selector on an `h2` loses to a global `h2` rule** in these light-theme components; use a descendant selector (`.parent .foo`), as `TopicGrid.astro` does.
- **Tabs** in `.ts` and `.astro` files.
