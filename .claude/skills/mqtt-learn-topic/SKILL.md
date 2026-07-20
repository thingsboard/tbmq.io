---
name: mqtt-learn-topic
description: Add or edit a topic on the /mqtt learn hub — the marketing MQTT guides at /mqtt/<slug>/. Covers the content registry entry, the auto-derived Learn nav, a comprehensive spec-based guide page, an ASCII diagram, TBMQ practical notes with /docs links, and the verification gates. Use this whenever someone wants to add an MQTT concept/glossary/learn page, a "what is X" or "X vs Y" MQTT guide, deepen an existing scaffold, or extend the MQTT learn hub — even if they don't name the hub explicitly.
---

# MQTT Learn Topic

The `/mqtt` learn hub is TBMQ's top-of-funnel SEO engine: educational MQTT guides that each tie a concept to a concrete TBMQ strength and link *into* the reference docs for depth. This skill is how you add or edit one topic without breaking the system or shipping inaccurate copy.

## Principles (why the hub is shaped this way)

- **Marketing-framed, not reference.** Guides are benefit-first and conversational ("what it is, why it matters"), so they target *informational* search intent and do **not** cannibalize `/docs/mqtt-broker/` (which targets *how-to/reference* intent). Depth is delegated: link into `/docs` rather than duplicating it.
- **One registry drives everything.** The hub grid, the Learn nav dropdown, related-topics, breadcrumbs, and per-page SEO all read from `src/data/mqttLearn.ts`. Adding a topic is mostly a registry entry + a thin page.
- **Accuracy is the product.** These are public technical pages under TBMQ's name. A wrong protocol detail or an overstated product claim erodes the trust the whole funnel depends on. See [Content accuracy](#content-accuracy-mandatory) — it's the part most likely to bite you.

## File map

```
src/data/mqttLearn.ts                  ← topic registry + helpers (getTopic, topicHref, relatedTopics, marqueeTopics)
src/data/navigation.ts                 ← learnSubmenu is DERIVED from marqueeTopics — you do NOT hand-edit nav
src/components/MqttLearn/
  MqttTopicLayout.astro                ← the page template (breadcrumb, hero, quick-answer, <slot/>, How-TBMQ, FAQ, related, CTA)
  QuickAnswer.astro                    ← boxed definition (auto, from registry.quickAnswer)
  HowTbmqBlock.astro                   ← green tie-in block (auto, from registry.tbmqTieIn; links to /product/ + /docs/mqtt-broker/)
  FaqAccordion.astro                   ← accordion + FAQPage JSON-LD; exports `interface FaqItem { q; a }`
  RelatedTopics.astro                  ← grid from registry.related[]
  LearnCta.astro                       ← bottom CTA band
  TopicGrid.astro                      ← hub grid over all topics
  AsciiDiagram.astro                   ← monospaced diagram block (see Diagrams)
src/pages/mqtt/
  index.astro                          ← the hub
  <slug>.astro                         ← one thin page per topic
```

Existing pages are the best reference. Flagships (full guides): `what-is-mqtt.astro`, `mqtt-vs-kafka.astro`, `shared-subscriptions.astro`. Short scaffolds: `qos.astro`, `topics.astro`, etc.

## Adding a topic — the two steps

Nav needs **no** edit: `learnSubmenu` in `navigation.ts` maps over `marqueeTopics`, which is derived from the registry. The only nav lever is the `marquee` flag on the entry.

### Step 1 — Registry entry (`src/data/mqttLearn.ts`)

Add one `MqttTopic` object to the `mqttTopics` array. Tabs for indentation (it's a `.ts` file).

```ts
{
	slug: 'keep-alive',                    // URL: /mqtt/keep-alive/ — MUST equal the page filename
	title: 'MQTT Keep-Alive and Ping',     // H1 + <title> (BaseLayout appends ' | TBMQ')
	navLabel: 'Keep-alive',                // short label for the dropdown + hub/related cards
	eyebrow: 'MQTT GUIDE',                 // hero eyebrow; use 'MQTT COMPARISON' for "X vs Y" pages
	quickAnswer:                           // 2–3 sentence boxed definition — the featured-snippet target
		'A concise, self-contained answer to "what is <topic>". First sentence should stand alone as a definition.',
	tbmqTieIn:                             // ONE sentence: how TBMQ relates. Renders in the How-TBMQ block + hub card.
		'A verified, specific TBMQ capability — not marketing fluff.',
	related: ['persistent-session', 'last-will', 'mqtt-client'], // 3–4 slugs; every one MUST exist (getTopic throws otherwise)
	marquee: false,                        // true = show in the Learn dropdown. Keep it curated (~6–7 headline topics).
	status: 'full',                        // 'full' = comprehensive guide; 'short' = scaffold
	seoDescription:                        // meta description (~150–160 chars), benefit-framed, includes the key term
		'MQTT keep-alive explained — the PINGREQ/PINGRESP mechanism, the keep-alive interval and 1.5× timeout, and how brokers detect dead clients.',
},
```

Rules that keep the build green:
- **`slug` === page filename.** `/mqtt/keep-alive/` ⇒ `src/pages/mqtt/keep-alive.astro`.
- **Every `related[]` slug must resolve.** `getTopic` throws at build on an unknown slug, so a typo fails loudly (good) — but check it. Keep arrays at 3–4 entries so the related grid stays tidy.
- **`marquee` is the nav.** Setting it `true` adds the topic to the Learn dropdown automatically. Reserve it for headline funnel topics; the dropdown is deliberately short.
- **Wire the hub-and-spoke both ways.** Add the new slug into the `related[]` of the closest existing topics, and where natural add an in-body link from a high-traffic page (e.g. `what-is-mqtt.astro`). Isolated pages don't rank.

### Step 2 — Guide page (`src/pages/mqtt/<slug>.astro`)

A thin page that fills the layout's body slot and passes a FAQ array. Tabs for indentation. In JSX body text, write literal `<`/`>`/`&` as `&lt;`/`&gt;`/`&amp;`. Internal links use the trailing-slash form `/mqtt/<slug>/`.

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
import AsciiDiagram from '@components/MqttLearn/AsciiDiagram.astro';
import type { FaqItem } from '@components/MqttLearn/FaqAccordion.astro';

// ASCII diagram as a template literal → passed as a string, so JSX never parses the < > | characters.
// Avoid backticks and ${ inside the art. This is the SWAP SEAM: replace <AsciiDiagram/> with a
// Claude Design HTML diagram later without touching the prose.
const keepAliveDiagram = `
 client                          broker
   │   ── PINGREQ ──────────────▶  │
   │   ◀────────────── PINGRESP ──  │   within keep-alive interval
   │                               │
   │        (silence > 1.5×)       │
   │   ✗ broker declares client dead, publishes Last Will
`;

const faq: FaqItem[] = [
	{ q: 'What is the MQTT keep-alive interval?', a: 'Plain-text answer. No HTML or links here — FaqAccordion renders answers as text and emits FAQPage JSON-LD from them.' },
	{ q: 'What happens if a client misses the keep-alive?', a: '...' },
];
---

<MqttTopicLayout slug="keep-alive" faq={faq}>
	<p>One-paragraph intro that frames the concept in plain language.</p>

	<h2>How it works</h2>
	<p>Spec-accurate explanation of the mechanism — packets, roles, sequence, timers.</p>

	<AsciiDiagram content={keepAliveDiagram} caption="Keep-alive ping cycle and dead-client detection" />

	<h2>Keep-alive at a glance</h2>
	<div class="overflow-x">
		<table>
			<thead><tr><th>Setting</th><th>Meaning</th></tr></thead>
			<tbody>
				<tr><td>Keep-alive interval</td><td>Max idle time the client promises between packets</td></tr>
			</tbody>
		</table>
	</div>

	<h2>Keep-alive in TBMQ</h2>
	<p>
		Practical notes on TBMQ's behavior (verified — see Content accuracy), with a link into the docs
		for depth: <a href="/docs/mqtt-broker/user-guide/...">the relevant reference page</a>.
	</p>
</MqttTopicLayout>
```

The layout auto-renders, around your slot: breadcrumb → hero (from `title`/`eyebrow`) → `QuickAnswer` (from `quickAnswer`) → **your body** → `HowTbmqBlock` (from `tbmqTieIn`) → `FaqAccordion` (from `faq`) → `RelatedTopics` (from `related`) → `LearnCta`. So you never hand-write those.

## Comprehensive-guide content model

A `status: 'full'` guide should be genuinely self-explaining. Body skeleton (all inside the `<slot/>`; the layout styles `h2/h3/p/ul/ol/li/a/code/table/th/td/.overflow-x` via scoped `:global`):

1. **Intro** — one short paragraph of context.
2. **How it works** — the spec-accurate mechanism. This is the core; get it right.
3. **Diagram** — an `<AsciiDiagram>` where a picture beats prose (fan-out, a connection/ping sequence, request/response-vs-pub/sub). Optional but encouraged.
4. **At-a-glance** — a table or tight list. **Required for "X vs Y" comparison pages** (feature-by-feature table, wrapped in `<div class="overflow-x">`).
5. **<Topic> in TBMQ** — practical notes + explicit `/docs/mqtt-broker/…` link(s). The `HowTbmqBlock` also renders `tbmqTieIn` automatically; this section is where you go deeper and point to docs.
6. **FAQ** — 3–5 real questions people search. Plain-text answers (they become FAQPage JSON-LD).

Keep it benefit-first and readable. If you find yourself writing configuration steps or a full reference table, stop — that belongs in `/docs`; link to it instead.

## Diagrams

Use `AsciiDiagram` for now; it's the seam for upgrading to Claude Design HTML diagrams later.

- Define the art as a `const name = ` template literal in the frontmatter and pass `content={name}`. This keeps `<`, `>`, `|`, `+` out of the JSX parser.
- Avoid backticks and `${` inside the art (they break the template literal).
- Add a `caption` for context; `AsciiDiagram` renders `<figure><pre>…</pre><figcaption>…</figcaption></figure>`, monospaced with horizontal scroll on narrow screens.
- Keep diagrams under ~80 columns so they don't force scrolling on desktop.
- To upgrade later: replace the single `<AsciiDiagram content={…} caption={…}/>` line with the HTML-diagram component — the surrounding prose is untouched.

## Content accuracy (mandatory)

This is the step batch 1 got wrong three times before review caught it. Do not skip it.

- **Protocol claims must match the MQTT spec** (3.1.1 / 5.0). Ports, QoS semantics, packet names, wildcard rules, version differences — state them precisely.
- **Every TBMQ product claim must be verified** against the broker source at `~/projects/tbmq` (config defaults, feature support) or the shipped docs under `src/content/.../mqtt-broker/`. If you can't verify it, don't claim it. Prefer "TBMQ supports X" only when you've seen X in source/docs.
- **Cautionary examples from batch 1** (all were plausible-sounding and wrong):
  - *WebSocket ports:* `8083` is TBMQ's HTTP/UI/REST port; the MQTT-over-WS defaults are **8084 (WS)** and **8085 (WSS)**.
  - *QoS durability:* TBMQ acks a QoS 1/2 publish only after Kafka accepts it, but the shipped defaults are `acks=1` / `replication.factor=1`. Don't claim "never lost even if a node fails" unconditionally — scope it (survives a TBMQ node failure; needs a replicated Kafka cluster to survive a Kafka node failure).
  - *Retention:* the `retain` flag stores the **last value**, not a replayable history/log.
- When unsure between two phrasings, pick the one that's true under TBMQ's **default** configuration.

## Verification

Run these before considering a topic done (dev server on `http://localhost:4321`; start with `pnpm dev` if needed):

```bash
pnpm check                 # astro type-check — expect 0 errors
pnpm lint:eslint           # expect clean
pnpm lint:slugcheck        # expect no mismatches
pnpm exec prettier --write src/pages/mqtt/<slug>.astro src/data/mqttLearn.ts   # then --check
curl -s http://localhost:4321/mqtt/<slug>/ | grep -o 'How TBMQ handles this'   # page renders + layout wired
curl -s http://localhost:4321/mqtt/<slug>/ | grep -o '"@type":"FAQPage"'        # FAQ JSON-LD present (if faq given)
pnpm lint:linkcheck        # builds + validates all internal links (run after new pages exist; catches bad /mqtt/ and /docs/ links)
```

Ask the user before running `pnpm build:fast` (repo build policy). For anything user-facing, do a quick headless-Chrome visual pass on the new page + the Learn dropdown at desktop and mobile.

## Gotchas

- **Tabs** in `.ts` and `.astro` files (repo convention; prettier enforces it).
- **Entities in JSX bodies:** `&lt;` `&gt;` `&amp;`. In FAQ *string* values (plain JS strings), raw `<`/`>` are fine.
- **Trailing-slash links:** `/mqtt/<slug>/`, `/docs/mqtt-broker/…/` — the site uses `trailingSlash: 'always'`.
- **`HowTbmqBlock` links are fixed** to `/product/` and `/docs/mqtt-broker/`; put topic-specific doc links in your body instead.
- **`marquee: true`** grows the nav dropdown — confirm that's intended before flipping it.
- **`/mqtt/<slug>/` must not collide** with a docs path; the learn hub lives under `/mqtt/`, docs under `/docs/mqtt-broker/`, so `/mqtt/mqtt-broker/` is fine.
