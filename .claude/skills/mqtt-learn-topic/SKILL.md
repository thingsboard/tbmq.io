---
name: mqtt-learn-topic
description: Add or edit a topic on the /mqtt learn hub — the marketing MQTT guides at /mqtt/<slug>/. Covers the content registry entry, the hub-grid category, the curated Learn nav, a comprehensive spec-based guide page, a designed inline-SVG diagram, TBMQ practical notes with /docs links, and the verification gates. Use this whenever someone wants to add an MQTT concept/glossary/learn page, a "what is X" or "X vs Y" MQTT guide, deepen an existing scaffold, or extend the MQTT learn hub — even if they don't name the hub explicitly.
---

# MQTT Learn Topic

The `/mqtt` learn hub is TBMQ's top-of-funnel SEO engine: educational MQTT guides that each tie a concept to a concrete TBMQ strength and link *into* the reference docs for depth. This skill is how you add or edit one topic without breaking the system or shipping inaccurate copy.

**Companion skill — `tbmq-docs-page`.** Every learn guide has a technical counterpart under `/docs/mqtt-broker/`. That reference doc is authored/reviewed with the sibling **`tbmq-docs-page`** skill. The two are deliberately **complementary, never duplicative**: the *learn* page teaches the general MQTT concept and *why it matters* (spec-level, vendor-neutral); the *doc* page covers TBMQ-specific parameters, defaults, behaviors, and step-by-step instructions. When you add or deepen a learn topic, check whether its paired doc exists and link to it (see below); when the doc is missing or thin, that's a `tbmq-docs-page` job.

## Principles (why the hub is shaped this way)

- **Marketing-framed, not reference.** Guides are benefit-first and conversational ("what it is, why it matters"), so they target *informational* search intent and do **not** cannibalize `/docs/mqtt-broker/` (which targets *how-to/reference* intent). Depth is delegated: link into `/docs` rather than duplicating it.
- **Every guide links its companion doc.** The `<Topic> in TBMQ` body section must carry an in-body link to the guide's single most-relevant `/docs/mqtt-broker/` page — a **specific** page where one exists (both `concepts/*` and `user-guide/*` targets are valid; pick the closest), or the generic `/docs/mqtt-broker/` root *only* as a placeholder when no dedicated doc exists yet (upgrade it when the doc lands). Always link the **CE** path (`/docs/mqtt-broker/user-guide/…`), never `/docs/mqtt-broker/pe/…` — the learn hub is vendor-neutral and both editions render the same content. `HowTbmqBlock`'s auto-rendered docs link is generic by design, so the specific link lives in your body. Watch for the near-miss where the section links only `architecture`/`getting-started` (adjacent docs) but *not* the topic's own companion page — that still counts as a gap (e.g. `mqtt-broker` linked those two but was missing its own `user-guide/mqtt-broker` link until it was added).
- **One registry drives everything.** The hub grid, the Learn nav dropdown, related-topics, breadcrumbs, and per-page SEO all read from `src/data/mqttLearn.ts`. Adding a topic is mostly a registry entry + a thin page. Note `quickAnswer` is **dual-purpose**: it renders in full inside the `QuickAnswer` box *and* as the hub-grid card blurb (CSS-clamped to 4 lines) — so its opening must read well both as a standalone definition and as a ~4-line card preview.
- **Accuracy is the product.** These are public technical pages under TBMQ's name. A wrong protocol detail or an overstated product claim erodes the trust the whole funnel depends on. See [Content accuracy](#content-accuracy-mandatory) — it's the part most likely to bite you.

## File map

```
src/data/mqttLearn.ts                  ← topic registry + helpers (getTopic, topicHref, relatedTopics, learnNavSlugs) + hub-grid taxonomy (mqttCategories, mqttCategoryGroups)
src/data/navigation.ts                 ← learnSubmenu maps learnNavTopics (from mqttLearn.ts) — don't hand-edit the nav markup
src/components/MqttLearn/
  MqttTopicLayout.astro                ← the page template (breadcrumb, hero, quick-answer, <slot/>, How-TBMQ, FAQ, related, CTA)
  QuickAnswer.astro                    ← boxed definition (auto, from registry.quickAnswer)
  HowTbmqBlock.astro                   ← green tie-in block (auto, from registry.tbmqTieIn; links to /product/ + /docs/mqtt-broker/)
  FaqAccordion.astro                   ← accordion + FAQPage JSON-LD; exports `interface FaqItem { q; a }`
  RelatedTopics.astro                  ← grid from registry.related[]
  LearnCta.astro                       ← bottom CTA band
  TopicGrid.astro                      ← hub grid: topics grouped by mqttCategories + a category jump-nav
  MqttDiagram.astro                    ← designed inline-SVG diagram (framed canvas + click-to-enlarge) — the standard (see Diagrams)
  AsciiDiagram.astro                   ← monospaced ASCII fallback for quick scaffolds
  LearnFeatureGrid.astro               ← 2-col feature/benefit cards (icon chip + title + one-line text); props {icon,title,text}[]
  LearnCardGrid.astro                  ← 2-col link tiles (title + blurb) to other topics; props {href,title,blurb}[]
  LearnIconRows.astro + LearnIconRow   ← bordered icon-row panel for capability lists (icon + bold label + description w/ inline links)
  LearnTypeCards.astro                 ← 2-col type/variant cards, optional "you're here — TBMQ" highlight + badge; props {icon,title,text,highlight?,badge?}[]
src/pages/mqtt/
  index.astro                          ← the hub
  <slug>.astro                         ← one thin page per topic
```

Existing pages are the best reference. Flagships (full guides): `what-is-mqtt.astro`, `mqtt-vs-kafka.astro`, `shared-subscriptions.astro`. Short scaffolds: `qos.astro`, `topics.astro`, etc.

## Adding a topic — the two steps

The Learn nav dropdown is a **curated, ordered** subset — not every topic. `learnSubmenu` in `navigation.ts` maps `learnNavTopics`, which is `learnNavSlugs.map(getTopic)` in `mqttLearn.ts`. To feature a topic in the dropdown, add its slug to `learnNavSlugs` (list position = display order, independent of the hub-grid order) and give the topic an `icon`. You never hand-edit the nav markup — only that list + the icon field.

### Step 1 — Registry entry (`src/data/mqttLearn.ts`)

Add one `MqttTopic` object to the `mqttTopics` array. Tabs for indentation (it's a `.ts` file).

```ts
{
	slug: 'keep-alive',                    // URL: /mqtt/keep-alive/ — MUST equal the page filename
	title: 'MQTT Keep-Alive and Ping',     // H1 + <title> (BaseLayout appends ' | TBMQ')
	navLabel: 'Keep-alive',                // short label for the dropdown + hub/related cards
	eyebrow: 'MQTT GUIDE',                 // hero eyebrow; use 'MQTT COMPARISON' for "X vs Y" pages
	quickAnswer:                           // 2–3 sentences — featured-snippet target. Renders in the QuickAnswer box (full) AND the hub card (clamped to 4 lines).
		'A concise, self-contained answer to "what is <topic>". First sentence must stand alone as a definition; keep the opening ~4 lines readable as a card preview.',
	tbmqTieIn:                             // ONE sentence: how TBMQ relates. Renders in the How-TBMQ block + hub card.
		'A verified, specific TBMQ capability — not marketing fluff.',
	related: ['persistent-session', 'last-will', 'mqtt-client'], // 3–4 slugs; every one MUST exist (getTopic throws otherwise)
	// icon: '/src/assets/images/landings/nav/learn-<slug>.svg', // ONLY if the topic is in learnNavSlugs (nav dropdown); see below
	status: 'full',                        // 'full' = comprehensive guide; 'short' = scaffold
	seoDescription:                        // meta description (~150–160 chars), benefit-framed, includes the key term
		'MQTT keep-alive explained — the PINGREQ/PINGRESP mechanism, the keep-alive interval and 1.5× timeout, and how brokers detect dead clients.',
},
```

Rules that keep the build green:
- **`slug` === page filename.** `/mqtt/keep-alive/` ⇒ `src/pages/mqtt/keep-alive.astro`.
- **Categorize it — same file.** Add the slug to exactly one category in the `mqttCategories` array (order within a category = its card order on the hub). This array drives the hub-grid grouping and the category jump-nav. A build-time guard in `mqttLearn.ts` throws if any topic is missing from `mqttCategories` (or a slug is duplicated/misspelled), so a forgotten topic fails the build instead of silently vanishing from the grid.
- **Every `related[]` slug must resolve.** `getTopic` throws at build on an unknown slug, so a typo fails loudly (good) — but check it. Keep arrays at 3–4 entries so the related grid stays tidy.
- **The nav dropdown is curated + ordered.** To feature a topic, add its slug to `learnNavSlugs` (position = display order, independent of the hub grid) and add an `icon` — a duotone `currentColor` SVG in `src/assets/images/landings/nav/` matching the Company-menu icons (24×24, primary fill + a `fill-opacity="0.3"` accent, inlined and theme-tinted by `NavIcon`). Keep the dropdown short: a handful of headline topics plus "Browse all guides".
- **Wire the hub-and-spoke both ways.** Add the new slug into the `related[]` of the closest existing topics, and where natural add an in-body link from a high-traffic page (e.g. `what-is-mqtt.astro`). Isolated pages don't rank.

### Step 2 — Guide page (`src/pages/mqtt/<slug>.astro`)

A thin page that fills the layout's body slot and passes a FAQ array. Tabs for indentation. In JSX body text, write literal `<`/`>`/`&` as `&lt;`/`&gt;`/`&amp;`. Internal links use the trailing-slash form `/mqtt/<slug>/`.

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
import MqttDiagram from '@components/MqttLearn/MqttDiagram.astro';
import type { FaqItem } from '@components/MqttLearn/FaqAccordion.astro';

const faq: FaqItem[] = [
	{ q: 'What is the MQTT keep-alive interval?', a: 'Plain-text answer. No HTML or links here — FaqAccordion renders answers as text and emits FAQPage JSON-LD from them.' },
	{ q: 'What happens if a client misses the keep-alive?', a: '...' },
];
---

<MqttTopicLayout slug="keep-alive" faq={faq}>
	<p>One-paragraph intro that frames the concept in plain language.</p>

	<h2>How it works</h2>
	<p>Spec-accurate explanation of the mechanism — packets, roles, sequence, timers.</p>

	{/* Diagram: an inline <svg> in MqttDiagram's slot, styled with the .d-* vocabulary. See Diagrams. */}
	<MqttDiagram caption="Keep-alive ping cycle and dead-client detection">
		<svg
			viewBox="0 0 680 196"
			role="img"
			aria-label="MQTT keep-alive: the client sends PINGREQ within the interval, the broker replies PINGRESP; after 1.5x the interval with no packet the broker drops the client"
		>
			<rect class="d-actor" x="90" y="24" width="120" height="34" rx="9"></rect>
			<text class="d-alabel d-mid" x="150" y="46">Client</text>
			<rect class="d-actor d-actor--hero" x="470" y="24" width="120" height="34" rx="9"></rect>
			<text class="d-alabel d-alabel--hero d-mid" x="530" y="46">Broker</text>
			<line class="d-life" x1="150" y1="58" x2="150" y2="176"></line>
			<line class="d-life" x1="530" y1="58" x2="530" y2="176"></line>
			<line class="d-line" x1="150" y1="92" x2="527" y2="92" marker-end="url(#arGray)"></line>
			<rect class="d-chip" x="292" y="81" width="96" height="22" rx="11"></rect>
			<text class="d-ctext d-mid" x="340" y="96">PINGREQ</text>
			<line class="d-line d-line--green" x1="530" y1="122" x2="153" y2="122" marker-end="url(#arGreen)"></line>
			<rect class="d-chip d-chip--green" x="290" y="111" width="100" height="22" rx="11"></rect>
			<text class="d-ctext d-ctext--green d-mid" x="340" y="126">PINGRESP</text>
			<text class="d-note d-mid" x="340" y="164"
				>no packet for 1.5× keep-alive → broker drops the client &amp; fires the Last Will</text
			>
		</svg>
	</MqttDiagram>

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
3. **Diagram** — a `<MqttDiagram>` where a picture beats prose (fan-out, a connection/ping sequence, request/response-vs-pub/sub, an auth gate). Optional but encouraged.
4. **At-a-glance** — a table or tight list. **Required for "X vs Y" comparison pages** (feature-by-feature table, wrapped in `<div class="overflow-x">`).
5. **<Topic> in TBMQ** — practical notes + a **required** explicit link to the companion `/docs/mqtt-broker/…` page (see the "Every guide links its companion doc" principle). Stay high-level here — name the TBMQ behavior and hand off to the doc for the parameters/steps; do **not** reproduce the doc's config tables or reason-code lists (that's the duplication the two-surface split exists to avoid). The `HowTbmqBlock` also renders `tbmqTieIn` automatically; this section is where you go deeper and point to the doc.
6. **FAQ** — 3–5 real questions people search. Plain-text answers (they become FAQPage JSON-LD).

Keep it benefit-first and readable. If you find yourself writing configuration steps or a full reference table, stop — that belongs in `/docs`; link to it instead.

## Content block components (prefer these over plain bullet lists)

Body lists read better as designed blocks than as raw `<ul>`s. **Default to these shared components for bold-lead lists** — don't ship a plain `<strong>Label:</strong> …` bullet list when one of these fits. They all use our tokens (green tints via `rgba($color-pe, …)`, tabler icons via `astro-icon`, `--shadow-sm` + a reduced-motion-gated lift on hover), so they stay on-brand with no new hex:

| Component | Use for | Authoring |
|---|---|---|
| `LearnFeatureGrid` | a set of **benefits / features** ("why X for IoT", "advantages") | `features={[{ icon, title, text }]}` — `text` is plain (no links) |
| `LearnCardGrid` | a **link list** to other topics/pages — title + blurb tiles | `cards={[{ href, title, blurb }]}` |
| `LearnIconRows` + `LearnIconRow` | a **capability / responsibility list** ("what the broker manages", "what CONNECT carries", "what a client can do") — items whose descriptions MAY carry inline `<a>` links | wrapper + one `<LearnIconRow icon="tabler:…" title="Label">description with <a href="…">links</a></LearnIconRow>` per item. The row renders the em-dash; the description is slot content, so inline links work. |
| `LearnTypeCards` | an enumeration of **types / variants / options** ("types of brokers", "one-way vs mutual TLS") — icon + title + plain text, with an optional highlighted "you're here" card | `cards={[{ icon, title, text, highlight?, badge? }]}` — `text` is plain (no links). On the option TBMQ *is*, set `highlight: true` + `badge: "You're here — TBMQ"`. |

**Which one — decide by the list's shape:**
- items are `<strong>Label:</strong> description` (facets/responsibilities), possibly with links → **`LearnIconRows`**
- items enumerate *kinds/variants* of the thing, plain descriptions → **`LearnTypeCards`**
- items are selling-point benefits → **`LearnFeatureGrid`**
- items are links to other guides → **`LearnCardGrid`**
- label-less simple bullets → keep a plain `<ul>`; many-column comparison data → a `<table>` (see the content model).

**Reuse across guides.** These blocks are shared on purpose — apply them wherever the same shape recurs, not only on the page you're editing. Pick tabler icons that match each item's meaning, and **verify the icon name exists** in `@iconify-json/tabler` before using it (a missing name fails the build).

**`LearnTypeCards` text is plain — no markup.** If a variant needs an inline doc link (e.g. mTLS → client-certificate auth), keep the card `text` plain and put the link in a short `<p>` right after the grid.

**Why the blocks use `<div>`/`<span>`, not `<p>`/`<h3>`:** the layout's `.learn-body :global(p|h3|ul|li|a|…)` prose rules out-specify a component's own scoped class, so a `<p>`/`<h3>` inside a block would inherit the 17px/20px body sizing. The block components deliberately use `<div>`/`<span>` (which the prose rules don't target) for their text; only real inline links stay `<a>` (and correctly pick up the green prose-link style). Follow the same rule in any new block component — this is the same cascade trap as the scoped-`h2` gotcha below.

## Diagrams

`MqttDiagram` is the standard — every shipped page uses it. You pass an inline `<svg>` in its default slot; the component wraps it in a framed, centered canvas and wires up click-to-enlarge (a single shared `<dialog>`), so you only author the SVG. `AsciiDiagram` remains as a quick monospaced fallback, but prefer `MqttDiagram` for anything user-facing.

**Author the SVG (`/mqtt` pages are `forceLightTheme`, so colours are light-locked):**

- Give the `<svg>` a `viewBox="0 0 680 H"`, `role="img"`, and a descriptive `aria-label`. The canvas sizes the SVG to `max-width: 680px` (min 520px), so **design on a ~680-wide grid** and choose `H` to fit the content snugly.
- Style with the shared **`.d-*` vocabulary** (defined once in `MqttDiagram.astro`, scoped under `.mqtt-diagram` so the short names can't leak). The common ones:
  - actors: `.d-actor`, `.d-actor--hero` (green — use for the broker)
  - labels: `.d-alabel`, `.d-alabel--hero`
  - packet/monospace text: `.d-ctext`, `.d-ctext--green`
  - chips (rounded rects behind packet labels): `.d-chip`, `.d-chip--green`
  - connectors: `.d-line`, `.d-line--green`, `.d-line--red`; lifelines `.d-life`
  - annotations: `.d-note`, `.d-feat`, `.d-tiny`, `.d-head`; verdicts `.d-yes` / `.d-no`
  - text anchoring: `.d-mid` (middle), `.d-end`
  Read the component for the full list before inventing a class — add to the component, don't inline one-off styles.
- Arrowheads: put `marker-end="url(#arGray)"` (neutral), `url(#arGreen)` (success/accept), or `url(#arRed)` (failure/deny) on a `<line>` or `<path>`. Those three markers are defined in the component.
- **Astro/JSX SVG rules — these bite:**
  - Every element needs an **explicit closing tag** (`</rect>`, `</line>`, `</text>`, `</path>`). No self-closing `/>` on SVG children in the slot.
  - Inside `<text>`, escape `&` as `&amp;` and `'` as `&apos;`. Use **literal unicode glyphs** (`→ × · ✓ ✗ —`), not HTML entities like `&rarr;`.
- One diagram per page, near "How it works". Keep collision-free: give arrows/labels room so a connector never crosses its own text. **Curved and fanned paths bite specifically** — a label that clears the straight connectors can still be clipped by a curve rising/falling through it near a fan-out point, and `.d-*` label text has **no background/halo** to mask an overlap, so position each label clear of *every* nearby path (straight and curved), not just the obvious one. (Real regression: on `what-is-mqtt` the `copy` label sat at `x=452`, exactly where the upper delivery curve rose through `y≈134`; moving it to `x=464` into the open wedge between arrows fixed it.)
- **Verify it visually the right way:** the inline canvas and the enlarge-modal are *separate* DOM. Screenshot the **inline page** (not just the opened modal) with headless Chrome — a past regression slipped because QA only shot the modal.

## Content accuracy (mandatory)

This is the step batch 1 got wrong three times before review caught it. Do not skip it.

- **Completeness, not just correctness.** When reviewing or deepening a topic, audit the explanation against the MQTT spec for *missing* critical points — a core mechanism, a version difference, or an edge case a reader needs — not only for wrong claims. A guide that omits a load-bearing spec detail is incomplete even if everything it says is accurate.
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
- **Adding a slug to `learnNavSlugs`** grows the nav dropdown and needs a matching `icon` — confirm the topic is headline-worthy first; the dropdown is deliberately short.
- **`/mqtt/<slug>/` must not collide** with a docs path; the learn hub lives under `/mqtt/`, docs under `/docs/mqtt-broker/`, so `/mqtt/mqtt-broker/` is fine.
- **SVG in a `MqttDiagram` slot** needs explicit closing tags and `&amp;`/`&apos;` inside `<text>` (see Diagrams). A self-closing `<rect/>` or a raw `&` breaks the Astro parse — the build error points at the diagram.
- **Scoped `h2` loses to a global rule.** A one-class scoped selector on an `h2` in these light-theme components (e.g. `.foo` where `<h2 class="foo">`) is beaten by a global `(0,1,1)` `h2` rule, so the heading silently renders at the default size. Use a **descendant selector** (`.parent .foo`) to win — that's why `TopicGrid.astro`'s category label is `.topic-groups .topic-group__label`. (`h3` and below aren't affected.)
