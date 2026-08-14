---
name: mqtt-learn-topic
description: Add or edit a topic on the /mqtt learn hub — the marketing MQTT guides at /mqtt/<slug>/. Covers the content registry entry, the hub-grid category, the curated Learn nav, a comprehensive spec-based guide page, a designed inline-SVG diagram, TBMQ practical notes with /docs links, and the verification gates. Use this whenever someone wants to add an MQTT concept/glossary/learn page, a "what is X" or "X vs Y" MQTT guide, deepen an existing scaffold, or extend the MQTT learn hub — even if they don't name the hub explicitly.
---

# MQTT Learn Topic

The `/mqtt` learn hub is TBMQ's top-of-funnel SEO engine: educational MQTT guides that each tie a concept to a concrete TBMQ strength and link *into* the reference docs for depth. This skill is how you add or edit one topic without breaking the system or shipping inaccurate copy.

**Companion skill — `tbmq-docs-page`.** Every learn guide points at a technical counterpart under `/docs/`. That reference doc is authored/reviewed with the sibling **`tbmq-docs-page`** skill. The two are deliberately **complementary, never duplicative**: the *learn* page teaches the general MQTT concept and *why it matters* (spec-level, vendor-neutral); the *doc* page covers TBMQ-specific parameters, defaults, behaviors, and step-by-step instructions. When you add or deepen a learn topic, check whether its paired doc exists and link to it (see below); when the doc is missing or thin, that's a `tbmq-docs-page` job.

> **URL note.** The docs tree moved: it is `/docs/…` (CE) and `/docs/pe/…` (PE) — **not** the old `/docs/mqtt-broker/…`. Every shipped learn page already uses the new form; if you see `/docs/mqtt-broker/` anywhere in a link you write, it's wrong. (The string still legitimately appears in the repo as an `_includes` **directory** path and in image asset paths — neither is a URL.)

## Principles (why the hub is shaped this way)

- **Marketing-framed, not reference.** Guides are benefit-first and conversational ("what it is, why it matters"), so they target *informational* search intent and do **not** cannibalize `/docs/` (which targets *how-to/reference* intent). Depth is delegated: link into `/docs/` rather than duplicating it.
- **Every guide links its companion doc.** The `<Topic> in TBMQ` body section must carry an in-body link to the guide's single most-relevant `/docs/` page — a **specific** page where one exists, or the generic `/docs/` root *only* as a placeholder when no dedicated doc exists yet (upgrade it when the doc lands). All 34 shipped pages currently satisfy this, and only two (`mqtt-vs-amqp`, `mqtt-vs-coap`) fall back to the bare root — comparison pages legitimately do, since "MQTT vs AMQP" has no companion doc to write. Target namespaces in use today: `user-guide/*`, `user-guide/ui/*`, `security/*`, `security/authentication/*`, `integrations/*`, `concepts/*`, plus `architecture/` and `getting-started/`; deep anchors are fine (`/docs/security/overview/#authorization`). Always link the **CE** path, never `/docs/pe/…` — the learn hub is vendor-neutral and both editions render the same content. `HowTbmqBlock`'s auto-rendered docs link is the generic `/docs/` by design, so the specific link lives in your body. Watch for the near-miss where the section links only `architecture`/`getting-started` (adjacent docs) but *not* the topic's own companion page — that still counts as a gap. MQTT-5-feature topics with no dedicated doc legitimately share `/docs/user-guide/mqtt-protocol/` (the single most-linked target, 11 uses).
- **One registry drives everything.** The hub grid, the Learn nav dropdown, the in-category series rail, related-topics, breadcrumbs, and per-page SEO all read from `src/data/mqttLearn.ts`. Adding a topic is mostly a registry entry + a thin page. Two fields carry the summary load and are **not** interchangeable: `quickAnswer` fills the boxed definition at the top of the page, and `cardSummary` is the one-line hub-grid card blurb. `cardSummary` also feeds the hub's client-side search index (the haystack is `navLabel` + `cardSummary` + the category tag), so any term a reader would type to find the guide has to appear in one of those three.
- **Accuracy is the product.** These are public technical pages under TBMQ's name. A wrong protocol detail or an overstated product claim erodes the trust the whole funnel depends on. See [Content accuracy](#content-accuracy-mandatory) — it's the part most likely to bite you.

## File map

```
src/data/mqttLearn.ts                  ← topic registry + helpers (getTopic, topicHref, relatedTopics, categoryForSlug,
                                         learnNavSlugs/learnNavTopics) + hub taxonomy (mqttCategories, mqttCategoryGroups)
src/data/navigation.ts                 ← learnSubmenu maps learnNavTopics (from mqttLearn.ts) — don't hand-edit the nav markup
scripts/mqtt-reading-time.mjs          ← regenerates every topic's readingMinutes from the built pages (see Reading time)
src/components/MqttLearn/
  MqttTopicLayout.astro                ← the page template — 3-column shell + the JS-built scrollspy TOC (see below)
  QuickAnswer.astro                    ← boxed definition (auto, from registry.quickAnswer) — renders as PLAIN TEXT, no HTML
  HowTbmqBlock.astro                   ← green tie-in block (auto, from registry.tbmqTieIn; links to /product/ + /docs/)
  TopicSeriesNav.astro                 ← auto sidebar rail listing every topic in this topic's category, current one marked
  FaqAccordion.astro                   ← accordion + FAQPage JSON-LD; answer `a` renders as HTML (inline `<code>`/`<strong>` ok), tag-stripped for the JSON-LD; exports `interface FaqItem { q; a }`
  RelatedTopics.astro                  ← grid from registry.related[]
  LearnCta.astro                       ← bottom CTA band
  TopicGrid.astro                      ← hub grid: sticky category filter pills + per-category sections + client-side search
  MqttDiagram.astro                    ← designed inline-SVG diagram (framed canvas + click-to-enlarge) — the standard (see Diagrams)
  AsciiDiagram.astro                   ← monospaced ASCII fallback; kept as a seam but no shipped page uses it — don't reach for it
  LearnFeatureGrid.astro               ← 2-col feature/benefit cards (icon chip + title + one-line text); props {icon,title,text}[]
  LearnCardGrid.astro                  ← 2-col link tiles (title + blurb) to other topics; props {href,title,blurb}[]
  LearnIconRows.astro + LearnIconRow   ← bordered icon-row panel for capability lists (icon + bold label + description w/ inline links)
  LearnTypeCards.astro                 ← 2-col type/variant cards, optional "you're here — TBMQ" highlight + badge; props {icon,title,text,highlight?,badge?}[]
src/pages/mqtt/
  index.astro                          ← the hub (hero + search input + <TopicGrid /> + CTA)
  <slug>.astro                         ← one thin page per topic (34 today)
```

Existing pages are the best reference — all 34 shipped topics are `status: 'full'` and every one carries exactly one `MqttDiagram`. Good models by shape: `mqtt-broker.astro` (widest component use), `qos.astro` (icon-rows + table), `what-is-mqtt.astro` (umbrella hub page), `mqtt-vs-kafka.astro` (comparison), `mqtt-reason-codes.astro` (page-local `<details>` reference blocks).

## Adding a topic — the two steps

The Learn nav dropdown is a **curated, ordered** subset — not every topic. `learnSubmenu` in `navigation.ts` maps `learnNavTopics`, which is `learnNavSlugs.map(getTopic)` in `mqttLearn.ts`. It currently holds five: `what-is-mqtt`, `mqtt-broker`, `qos`, `persistent-session`, `topics`. To feature a topic there, add its slug to `learnNavSlugs` (list position = display order, independent of the hub-grid order) and give the topic an `icon`. You never hand-edit the nav markup — only that list + the icon field.

### Step 1 — Registry entry (`src/data/mqttLearn.ts`)

Add one `MqttTopic` object to the `mqttTopics` array. Tabs for indentation (it's a `.ts` file).

```ts
{
	slug: 'keep-alive',                    // URL: /mqtt/keep-alive/ — MUST equal the page filename
	readingMinutes: 4,                     // REQUIRED but generated — put any placeholder, then regenerate (see "Reading time")
	title: 'MQTT Keep-Alive and Ping',     // H1 + <title> (BaseLayout appends ' | TBMQ')
	navLabel: 'Keep-alive',                // short label for the dropdown + hub/related cards + breadcrumb
	cardSummary:                           // REQUIRED. ONE sentence, ~90–120 chars — the hub-grid card blurb (clamped to 2 lines)
		'The heartbeat that keeps a connection alive and detects dead peers.',   // also part of the hub search index
	// icon: '/src/assets/images/landings/nav/learn-<slug>.svg', // ONLY if the topic is in learnNavSlugs (nav dropdown); see below
	eyebrow: 'MQTT GUIDE',                 // hero eyebrow; use 'MQTT COMPARISON' for "X vs Y" pages — those are the only two values in use
	quickAnswer:                           // 2–3 sentences — featured-snippet target, rendered in the QuickAnswer box. PLAIN TEXT ONLY (no <code>/<strong>).
		'A concise, self-contained answer to "what is <topic>". The first sentence must stand alone as a definition.',
	tbmqTieIn:                             // ONE sentence: how TBMQ relates. Renders in the How-TBMQ rail.
		'A verified, specific TBMQ capability — not marketing fluff.',
	related: ['persistent-session', 'last-will', 'mqtt-client'], // 3–4 slugs; every one MUST exist (getTopic throws otherwise)
	status: 'full',                        // every shipped topic is 'full'; 'short' exists in the type but is unused — don't ship a scaffold
	// startHere: true,                    // the single "Start here" badge on the hub — already taken by what-is-mqtt; don't add a second
	seoDescription:                        // meta description (~150–160 chars), benefit-framed, includes the key term
		'MQTT keep-alive explained — the PINGREQ/PINGRESP mechanism, the keep-alive interval and 1.5× timeout, and how brokers detect dead clients.',
},
```

Rules that keep the build green:

- **`slug` === page filename.** `/mqtt/keep-alive/` ⇒ `src/pages/mqtt/keep-alive.astro`.
- **`cardSummary` and `readingMinutes` are required** by the `MqttTopic` interface — omit either and `pnpm check` fails. They are the two fields most easily forgotten, because the page body never references them.
- **Categorize it — same file.** Add the slug to exactly one category in the `mqttCategories` array (order within a category = its card order on the hub). The five categories are `fundamentals` (MQTT fundamentals) · `connections` (Connections & sessions) · `mqtt-5` (MQTT 5.0 features) · `security` (Security) · `comparisons` (Transports & comparisons). This array drives the hub-grid grouping, the filter pills, and the sidebar series rail. A build-time guard in `mqttLearn.ts` throws if any topic is missing from `mqttCategories` (or a slug is duplicated/misspelled), so a forgotten topic fails the build instead of silently vanishing from the grid.
- **Adding a whole new *category* is a three-file change.** Beyond the `mqttCategories` entry (`id`, `label`, `tag`, `accent` from the `MqttAccent` union), the per-category glyph lives in a `categoryIcon: Record<string, string>` keyed by `category.id` in **both** `TopicGrid.astro` **and** `TopicSeriesNav.astro`, and the accent needs a `.c-<accent>` custom-property block in each. A missing glyph or accent is **silent** — an empty `<svg>` and unstyled rail, not a build error. Prefer fitting a new topic into one of the five existing categories.
- **Every `related[]` slug must resolve.** `getTopic` throws at build on an unknown slug, so a typo fails loudly (good) — but check it. Keep arrays at 3–4 entries so the related grid stays tidy.
- **The nav dropdown is curated + ordered.** To feature a topic, add its slug to `learnNavSlugs` (position = display order, independent of the hub grid) and add an `icon` — a duotone `currentColor` SVG in `src/assets/images/landings/nav/` matching the Company-menu icons (24×24, primary fill + a `fill-opacity="0.3"` accent, inlined and theme-tinted by `NavIcon`). After adding or editing an icon, run `pnpm generate:nav-sprite` — without a manifest entry `NavIcon` renders nothing (it only warns in the log). Keep the dropdown short: a handful of headline topics plus "Browse all guides".
- **Wire the hub-and-spoke both ways.** Add the new slug into the `related[]` of the closest existing topics, and where natural add an in-body link from a high-traffic page (e.g. `what-is-mqtt.astro`). Isolated pages don't rank.

#### Reading time

**Generated, not guessed.** `scripts/mqtt-reading-time.mjs` counts words in the *built* page (200 wpm, `<main class="learn-page">` minus nav/aside/CTA/script/style/svg chrome) and rewrites `readingMinutes` back into the registry for **every** topic:

```bash
pnpm build:fast && pnpm generate:reading-time
```

It reads `dist/`, so it needs a build first — ask the user before running one (repo build policy). Put any placeholder in the field while drafting, then regenerate and **commit the registry diff it produces**; never leave a hand-invented number in the final commit. Because it rewrites all 34 topics at once, expect the diff to touch other pages if their content drifted since the last run — that's the script correcting them, not a mistake.

Shipped values sit at **2–4 minutes**, with `mqtt-reason-codes` at 8 (its collapsed `<details>` reason-code tables count toward the total).

### Step 2 — Guide page (`src/pages/mqtt/<slug>.astro`)

A thin page that fills the layout's body slot and passes a FAQ array. Tabs for indentation. In JSX body text, write literal `<`/`>`/`&` as `&lt;`/`&gt;`/`&amp;`. Internal links use the trailing-slash form `/mqtt/<slug>/` and `/docs/<path>/`.

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
import MqttDiagram from '@components/MqttLearn/MqttDiagram.astro';
import type { FaqItem } from '@components/MqttLearn/FaqAccordion.astro';

const faq: FaqItem[] = [
	{ q: 'What is the MQTT keep-alive interval?', a: 'The max idle time a client promises between packets. Answers may use inline <code>…</code> for special fields and <strong>…</strong> for the key takeaway (no links) — FaqAccordion renders the HTML and strips the tags for the FAQPage JSON-LD.' },
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
		for depth: <a href="/docs/user-guide/keep-alive/">the relevant reference page</a>.
	</p>
</MqttTopicLayout>
```

Everything around your slot is auto-rendered from the registry, so you never hand-write it. The shell is a **three-column** layout, not a single stack:

- **Hero band** — breadcrumb → eyebrow + `readingMinutes` badge → H1 (`title`) → `QuickAnswer` (`quickAnswer`).
- **Left rail** — a scrollspy TOC **built client-side from your body's `<h2>`s**, then `TopicSeriesNav` (every topic in this topic's category). Hidden below `lg`.
- **Center** — **your body**, then `FaqAccordion` (`faq`).
- **Right rail** — `HowTbmqBlock` (`tbmqTieIn`), sticky. It is *beside* your body, not after it, and it renders its own `<h2>How TBMQ handles this</h2>` — which stays out of the TOC because it lives outside `.learn-body`.
- **Foot** — `RelatedTopics` (`related`) → `LearnCta`.

Two consequences for how you write the body: **your `<h2>` text is the TOC label** (keep each one short and self-describing; IDs are auto-slugified from the text), and **only `<h2>`s appear** — an `<h3>` is invisible to the TOC.

## Comprehensive-guide content model

A `status: 'full'` guide should be genuinely self-explaining. Body skeleton (all inside the `<slot/>`; the layout styles `h2/h3/p/ul/ol/li/a/code/table/th/td/.overflow-x` via scoped `:global`). Shipped guides land at **3–4 `<h2>`s** (28 of 34; the range is 2–5) — treat that as the target, not a coincidence:

1. **Intro** — one short paragraph of context, *before* the first `<h2>`. Lead with the reader's problem, not a definition (the `QuickAnswer` box directly above already defines the term). Skip it only on an umbrella page whose first section is itself the overview (`what-is-mqtt`, `shared-subscriptions` both open on an `<h2>`).
2. **How it works** — the spec-accurate mechanism. This is the core; get it right.
3. **Diagram** — a `<MqttDiagram>` where a picture beats prose (fan-out, a connection/ping sequence, request/response-vs-pub/sub, an auth gate). Every shipped page has exactly one, placed right after the mechanism section.
4. **One or two middle sections.** Pick from the archetypes the hub already uses, rather than inventing a shape:
   - **At-a-glance** — a table or tight list. **Required for "X vs Y" comparison pages** (see below), and the natural fit whenever there are 3+ parallel variants to line up (`qos`, `persistent-session`, `websocket`, `mqtt-packets`).
   - **Version difference** — how 3.1.1 and 5.0 diverge, when that's the interesting part: `Server keep-alive (MQTT 5.0)`, `Will delay (MQTT 5.0)`, `MQTT 5.0 vs 3.1.1`, `Before MQTT 5.0`.
   - **Caveats / boundaries** — what readers get wrong: `Things to keep in mind`, `Uniqueness and client take-over`, `The indicator is a hint, not a contract`, `Why it matters: half-open connections`.
   - **Choosing / best practices** — `Choosing a level`, `Choosing a client ID`, `Naming best practices`, `What to look for in a broker`, `Good uses for user properties`.
   - **Sub-topic index** — on an umbrella topic, a `LearnCardGrid` of the guides underneath it (`what-is-mqtt` → 14 core concepts, `mqtt-5` → its 8 feature guides). This is the hub-and-spoke wiring doing double duty as content.
5. **`<Topic> in TBMQ`** — the **last** `<h2>` on the page, titled with the topic noun plus " in TBMQ" (`Keep-alive in TBMQ`, `The broker in TBMQ`, `Clients in TBMQ`, `Expiry in TBMQ`). Practical notes + a **required** explicit link to the companion `/docs/…` page (see the "Every guide links its companion doc" principle). One or two paragraphs is normal, and a `LearnIconRows` block is fine here too when TBMQ's behavior genuinely splits (see `persistent-session`, DEVICE vs APPLICATION). Stay high-level — name the TBMQ behavior and hand off to the doc for the parameters/steps; do **not** reproduce the doc's config tables or reason-code lists (that's the duplication the two-surface split exists to avoid). Naming a concrete default or constant (`Receive Maximum` of 1000, a Topic Alias Maximum of 10, a one-week session-expiry cap, `MQTT_TOPIC_MAX_SEGMENTS_COUNT`) is good and expected — a *table* of them is not.
6. **FAQ** — 3–5 real questions people search. Answers are prose that may carry inline `<code>` for special fields (topics, filters, `+`/`#`, packet names, ports, env vars) and `<strong>` for the key takeaway — no links. `FaqAccordion` renders the HTML and strips the tags so the FAQPage JSON-LD stays plain text.

Keep it benefit-first and readable. If you find yourself writing configuration steps or a full reference table, stop — that belongs in `/docs`; link to it instead.

## Comparison pages ("X vs Y")

The four shipped comparisons (`mqtt-vs-http`, `mqtt-vs-kafka`, `mqtt-vs-amqp`, `mqtt-vs-coap`) share one skeleton — follow it rather than improvising:

1. Intro paragraph framing the two as *built for different situations*, not as winner/loser.
2. `<h2>What each is for</h2>` (or `Two different models`) — one paragraph defining both, bolding each protocol name on first use.
3. `<MqttDiagram>` contrasting the two models side by side, or showing them in the same pipeline.
4. `<h2>MQTT vs <Y> at a glance</h2>` — the feature-by-feature table, wrapped in `<div class="overflow-x">`. **Required.** First column header is `&nbsp;`; rows are the comparison axes (model, transport, overhead, delivery, best for).
5. `<h2>When to use which</h2>` — one paragraph, and say plainly when the answer is "both" (it usually is).
6. `<h2>MQTT in TBMQ</h2>` — note the section title: comparisons use this, not `<Topic> in TBMQ`. Keep it short and non-triumphal. `mqtt-vs-kafka` is the one variant, closing on `Using them together` because the pipeline pattern *is* the TBMQ story.

Set `eyebrow: 'MQTT COMPARISON'` in the registry, and cross-link the sibling comparisons in the body — every one of the four points at at least one other.

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

How literally to take "default to these blocks": across 34 shipped pages there is **one** plain `<ul>` (the `+`/`#` wildcard pair in `topics.astro`) and **zero** `<ol>`s. `LearnIconRows` is the workhorse (17 pages); the other three are deliberately rarer (`LearnCardGrid` 2, `LearnTypeCards` 2, `LearnFeatureGrid` 1). If you've written a bold-lead bullet list, you almost certainly wanted a block.

**Where to put the props.** Short lists read fine inline (`cards={[…]}` in the markup, as in `mqtt-broker`/`mqtt-tls`); pull anything longer into a `const` in the frontmatter and pass it by name (`features={whyFeatures}`, `cards={conceptCards}`, as in `what-is-mqtt`). Either is idiomatic — just don't inline a 14-item array into the body.

**Reuse across guides.** These blocks are shared on purpose — apply them wherever the same shape recurs, not only on the page you're editing. Pick tabler icons that match each item's meaning, and **verify the icon name exists** in `@iconify-json/tabler` before using it (a missing name fails the build).

**`LearnTypeCards` text is plain — no markup.** If a variant needs an inline doc link (e.g. mTLS → client-certificate auth), keep the card `text` plain and put the link in a short `<p>` right after the grid.

**Why the blocks use `<div>`/`<span>`, not `<p>`/`<h3>`:** the layout's `.learn-body :global(p|h3|ul|li|a|…)` prose rules out-specify a component's own scoped class, so a `<p>`/`<h3>` inside a block would inherit the 17px/20px body sizing. The block components deliberately use `<div>`/`<span>` (which the prose rules don't target) for their text; only real inline links stay `<a>` (and correctly pick up the green prose-link style). Follow the same rule in any new block component — this is the same cascade trap as the scoped-`h2` gotcha below.

## Diagrams

`MqttDiagram` is the standard — every shipped page uses it, exactly once. You pass an inline `<svg>` in its default slot; the component wraps it in a framed, centered canvas and wires up click-to-enlarge (a single shared `<dialog>`), so you only author the SVG. `AsciiDiagram` still exists but no shipped page uses it — treat it as legacy, not as an easier option.

**Author the SVG (`/mqtt` pages are `forceLightTheme`, so colours are light-locked):**

- Give the `<svg>` a `viewBox="0 0 680 H"`, `role="img"`, and a descriptive `aria-label`. The canvas sizes the SVG to `max-width: 680px` (min 520px), so **design on a ~680-wide grid** and choose `H` to fit the content snugly.
- Style with the shared **`.d-*` vocabulary** (defined once in `MqttDiagram.astro`, scoped under `.mqtt-diagram` so the short names can't leak). The full set:
  - actors: `.d-actor`, `.d-actor--hero` (green — use for the broker)
  - labels: `.d-alabel`, `.d-alabel--hero`
  - packet/monospace text: `.d-ctext`, `.d-ctext--green`
  - chips (rounded rects behind packet labels): `.d-chip`, `.d-chip--green`
  - connectors: `.d-line`, `.d-line--green`, `.d-line--red`; lifelines `.d-life`
  - group/scenario headings: `.d-glabel` (bold 12px — labels the halves of a before/after or a three-column diagram), `.d-panelttl`, `.d-head`
  - region brackets: `.d-brk` (dashed frame around a zone, e.g. EDGE / DATA CENTER) + `.d-brklabel`
  - annotations: `.d-note`, `.d-feat`, `.d-tiny`, `.d-em` (green emphasis), `.d-danger` (red); verdicts `.d-yes` / `.d-no`
  - text anchoring: `.d-mid` (middle), `.d-end`

  Don't invent a class name — if none of these fits, add it to the component. **Per-diagram size and colour nudges via an inline `style` are fine and widely used** (`style="font-size:10.5px"` on a dense three-column layout, `style="fill:#166c37"` to tint a `.d-glabel` green for the "good" half, `style="font-size:14px;letter-spacing:.04em"` on a BROKER box). The rule is: shapes and semantics come from `.d-*`, one-off geometry from inline `style`.
- Arrowheads: put `marker-end="url(#arGray)"` (neutral), `url(#arGreen)` (success/accept), or `url(#arRed)` (failure/deny) on a `<line>` or `<path>`. Those three markers are defined in the component.
- **Before/after diagrams** (3.1.1 vs 5.0, allowed vs refused) stack two mini-sequences and separate them with a plain rule: `<line x1="40" y1="118" x2="640" y2="118" stroke="#eef0f3" stroke-width="1"></line>`. Column-style diagrams use the same hairline vertically. See `mqtt-5`, `mqtt-reason-codes`, `qos`.
- **Astro/JSX SVG rules — these bite:**
  - Every element needs an **explicit closing tag** (`</rect>`, `</line>`, `</text>`, `</path>`). No self-closing `/>` on SVG children in the slot.
  - Inside `<text>`, escape `&` as `&amp;` and `'` as `&apos;`. Use **literal unicode glyphs** (`→ × · ✓ ✗ —`), not HTML entities like `&rarr;`.
- One diagram per page, near "How it works". Keep collision-free: give arrows/labels room so a connector never crosses its own text. **Curved and fanned paths bite specifically** — a label that clears the straight connectors can still be clipped by a curve rising/falling through it near a fan-out point, and `.d-*` label text has **no background/halo** to mask an overlap, so position each label clear of *every* nearby path (straight and curved), not just the obvious one. (Real regression: on `what-is-mqtt` the `copy` label sat at `x=452`, exactly where the upper delivery curve rose through `y≈134`; moving it to `x=464` into the open wedge between arrows fixed it.)
- **Verify it visually the right way:** the inline canvas and the enlarge-modal are *separate* DOM. Screenshot the **inline page** (not just the opened modal) with headless Chrome — a past regression slipped because QA only shot the modal.

## Content accuracy (mandatory)

This is the step batch 1 got wrong three times before review caught it. Do not skip it.

- **Completeness, not just correctness.** When reviewing or deepening a topic, audit the explanation against the MQTT spec for *missing* critical points — a core mechanism, a version difference, or an edge case a reader needs — not only for wrong claims. A guide that omits a load-bearing spec detail is incomplete even if everything it says is accurate.
- **Protocol claims must match the MQTT spec** (3.1.1 / 5.0). Ports, QoS semantics, packet names, wildcard rules, version differences — state them precisely.
- **Every TBMQ product claim must be verified** against the broker source (config defaults, feature support) or the shipped docs under `src/content/_includes/docs/mqtt-broker/` (the content) and `src/content/docs/docs/` (the stubs). If you can't verify it, don't claim it. Prefer "TBMQ supports X" only when you've seen X in source/docs.
- **Finding the broker source.** The broker repos are checked out as **siblings of this repo**, so resolve them relative to the tbmq.io root instead of hardcoding a home directory: `../tbmq` (CE) and `../tbmq-pe` (PE). Confirm with `ls ../tbmq/application/src/main/resources/thingsboard-mqtt-broker.yml` before relying on the path. If neither sibling exists, ask for the checkout location — never substitute a guess, and never downgrade to asserting a default you haven't read. Learn-hub claims should hold for **CE**, so `../tbmq` is the one that matters unless the sentence is explicitly about PE.
- **Cautionary examples from batch 1** (all were plausible-sounding and wrong):
  - *WebSocket ports:* `8083` is TBMQ's HTTP/UI/REST port; the MQTT-over-WS defaults are **8084 (WS)** and **8085 (WSS)**.
  - *QoS durability:* TBMQ acks a QoS 1/2 publish only after Kafka accepts it, but the shipped defaults are `acks=1` / `replication.factor=1`. Don't claim "never lost even if a node fails" unconditionally — scope it (survives a TBMQ node failure; needs a replicated Kafka cluster to survive a Kafka node failure).
  - *Retention:* the `retain` flag stores the **last value**, not a replayable history/log.
- When unsure between two phrasings, pick the one that's true under TBMQ's **default** configuration.

## Verification

Run these before considering a topic done (dev server on `http://localhost:4321`; start it with `NODE_OPTIONS=--max-old-space-size=8192 pnpm dev` if needed — the default heap OOMs on hot restart in this repo):

```bash
pnpm check                 # astro type-check — expect 0 errors
pnpm lint:eslint           # expect clean
pnpm lint:slugcheck        # expect no mismatches
pnpm exec prettier --write src/pages/mqtt/<slug>.astro src/data/mqttLearn.ts   # then --check
curl -s http://localhost:4321/mqtt/<slug>/ | grep -o 'How TBMQ handles this'   # page renders + layout wired
curl -s http://localhost:4321/mqtt/<slug>/ | grep -o '"@type":"FAQPage"'        # FAQ JSON-LD present (if faq given)
curl -s http://localhost:4321/mqtt/<slug>/ | grep -oE 'href="/docs/[^"]*"'      # companion doc link present + not /docs/mqtt-broker/
curl -s http://localhost:4321/mqtt/ | grep -c 'topic-card'                     # new topic reached the hub grid
pnpm lint:linkcheck        # builds + validates all internal links (run after new pages exist; catches bad /mqtt/ and /docs/ links)
```

Ask the user before running `pnpm build:fast` (repo build policy). Then, if a topic was added or its body changed length, regenerate reading times off that build with `pnpm generate:reading-time` — and commit the registry diff it produces.

For anything user-facing, do a quick headless-Chrome visual pass on the new page + the Learn dropdown at desktop and mobile. On the page itself, check the three rails specifically: the left TOC lists your `<h2>`s and highlights on scroll, the series rail below it marks the current topic, and the sticky How-TBMQ rail sits beside the body rather than pushing it. On the hub, check the card (blurb not truncated mid-word, reading time present) and that the category filter pill still shows it.

## Gotchas

- **Docs links are `/docs/…/`, never `/docs/mqtt-broker/…/`.** The tree moved; only the `_includes` directory and image asset paths still carry that segment, and neither is a URL. Never link `/docs/pe/…` from a learn page.
- **Tabs** in `.ts` and `.astro` files (repo convention; prettier enforces it).
- **`cardSummary` + `readingMinutes` are required** and easy to miss, because nothing in the page body references them — a topic without both fails `pnpm check`.
- **Don't hand-edit `readingMinutes`.** It's generated — `pnpm generate:reading-time` off a build rewrites every topic (see [Reading time](#reading-time)).
- **`quickAnswer` is plain text; FAQ answers are HTML.** `QuickAnswer` interpolates `{text}`, so a `<code>` in `quickAnswer` renders as literal angle brackets. `FaqAccordion` uses `set:html`, so inline `<code>`/`<strong>` work there. Don't carry markup across from one to the other.
- **Entities in JSX bodies:** `&lt;` `&gt;` `&amp;`. FAQ answer strings render as HTML (`set:html`), so inline `<code>`/`<strong>` work — but a bare `<`/`>`/`&` that isn't part of a tag must be written `&lt;`/`&gt;`/`&amp;`.
- **Trailing-slash links:** `/mqtt/<slug>/`, `/docs/…/` — the site uses `trailingSlash: 'always'`.
- **`HowTbmqBlock` links are fixed** to `/product/` and `/docs/`; put topic-specific doc links in your body instead. (It takes an optional `detail` prop for a second sentence, but the layout doesn't pass one — extra context belongs in your `<Topic> in TBMQ` section, not there.)
- **A page-local `<style lang="scss">` block is allowed** when a topic genuinely needs a bespoke block the shared components don't cover — `mqtt-reason-codes` uses one for its per-packet `<details>` accordions. Open it with `@use '../../styles/variables' as *;` and use repo tokens (`$color-border`, `$color-pe-dark`, `$font-family-mono`), never raw hex. Reach for this last: if the shape recurs, promote it to a component in `MqttLearn/` instead.
- **Wrap every `<table>` in `<div class="overflow-x">`.** All 20 shipped tables do; the layout only sets `overflow-x: auto` on that class, so an unwrapped table breaks the page's horizontal scroll on mobile.
- **Adding a slug to `learnNavSlugs`** grows the nav dropdown, needs a matching `icon`, and needs `pnpm generate:nav-sprite` after the icon lands — confirm the topic is headline-worthy first; the dropdown is deliberately short.
- **`/mqtt/<slug>/` must not collide** with a docs path; the learn hub lives under `/mqtt/`, docs under `/docs/`, so `/mqtt/mqtt-broker/` (learn) and `/docs/user-guide/mqtt-broker/` (doc) coexist fine.
- **SVG in a `MqttDiagram` slot** needs explicit closing tags and `&amp;`/`&apos;` inside `<text>` (see Diagrams). A self-closing `<rect/>` or a raw `&` breaks the Astro parse — the build error points at the diagram.
- **Scoped `h2` loses to a global rule.** A one-class scoped selector on an `h2` in these light-theme components (e.g. `.foo` where `<h2 class="foo">`) is beaten by a global `(0,1,1)` `h2` rule, so the heading silently renders at the default size. Use a **descendant selector** (`.parent .foo`) to win — that's why `TopicGrid.astro`'s category label is `.topic-groups .topic-group__label`. (`h3` and below aren't affected.)
