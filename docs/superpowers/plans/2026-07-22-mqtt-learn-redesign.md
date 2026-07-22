# MQTT Learn Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `/mqtt` learn topic page into a 3-column layout (sticky TOC · content · sticky "How TBMQ" rail) with a tinted hero, structured-block tinting, card grids, and a tinted diagram — through the shared layout so all 32 pages get the frame, with `what-is-mqtt` as the first upgraded body.

**Architecture:** All structural changes live in the shared `MqttTopicLayout.astro` + shared components, so the 32 topic pages inherit the new frame automatically. Two small reusable components (`LearnFeatureGrid`, `LearnCardGrid`) replace the two bullet lists on `what-is-mqtt`. The left TOC is auto-built client-side from the page's `.learn-body h2`s with an `IntersectionObserver` scrollspy; no per-page authoring.

**Tech Stack:** Astro components, SCSS with `@use '../../styles/variables' as *`, `astro-icon` (tabler), no test framework — verification is `pnpm check` + eslint + prettier + curl render checks + headless-Chrome screenshots against the dev server on `http://localhost:4321`.

## Global Constraints

Every task's requirements implicitly include these (copied from the spec):

- **No new hex colors.** All colors come from existing SCSS tokens; tints are `rgba()` of the green tokens. Available: `$color-pe #17bb52`, `$color-pe-hover #35c86a`, `$color-pe-dark #1f8b4d`, `$color-pe-link #166c37`, `$color-text-primary #17181c`, `$color-text-secondary #63656c`, `$color-text-muted #707275`, `$color-bg-white #ffffff`, `$color-bg-surface` (CSS var `--color-bg-surface`), `$color-border #ebebeb`. The one pre-existing tint hex `#eaf7ef` (used by `QuickAnswer`/`HowTbmqBlock`) may be reused — it is not new.
- **Spacing/other tokens:** `$spacing-1 4 · 2 8 · 4 16 · 5 20 · 6 24 · 8 32 · 10 40 · 12 48 · 16 64 · 20 80`, `$radius-lg 8px`, `$radius-xl 16px`, `$font-weight-medium 500`, `$font-weight-semibold 600`, `$transition-fast 0.15s ease`, `$header-height 80px`.
- **Breakpoints:** `media-up(sm)` 480 · `media-up(md)` 750 · `media-up(lg)` 1024 · `media-down(lg)` ≤1023.
- **Reuse components/tokens.** Icons are `astro-icon` tabler names (mockup icons are placeholders). The existing SVG diagram is reused, not rebuilt.
- **Accessibility:** keyboard-focusable (`:focus-visible` outline `$color-pe`), respect `@media (prefers-reduced-motion: no-preference)` for any transition, responsive down to mobile.
- **Indentation:** TABS in `.astro`/`.ts` (prettier enforces). Escape `<`/`>`/`&` in JSX body text as `&lt;`/`&gt;`/`&amp;`.
- **COMMIT POLICY:** Do **not** run `git commit` until the user approves. Every task below ends at a verified, clean working-tree state (no commit step). Task 7 performs the commit(s) only after the user says so.
- **Reference mockup** `docs/superpowers/report/mqtt-guide-redesign.html` is visual reference only — do not copy its HTML/CSS/hex.

**Standing verification snippet** (referenced by tasks as "run the standard checks"):

```bash
cd /home/dlandiak/projects/tbmq.io
pnpm exec prettier --write <FILES>        # then confirm clean:
pnpm exec prettier --check <FILES>
pnpm check          # astro type-check — expect 0 errors
pnpm lint:eslint    # expect clean
```

Screenshot helper (dev server must be running — `NODE_OPTIONS=--max-old-space-size=8192 pnpm dev` if not):

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=<W>,<H> --screenshot=<OUT>.png <URL>
```

---

### Task 1: Tint the diagram canvas

**Files:**
- Modify: `src/components/MqttLearn/MqttDiagram.astro` (the `.mqtt-diagram__canvas` rule, ~line 144-152)

**Interfaces:**
- Consumes: nothing.
- Produces: no API change — `MqttDiagram` renders identically except the on-page canvas background is a faint green tint. The enlarge-modal stays white.

- [ ] **Step 1: Change the canvas background token**

In `src/components/MqttLearn/MqttDiagram.astro`, find:

```scss
	.mqtt-diagram__canvas {
		position: relative;
		background: $color-bg-white;
		border: 1px solid $color-border;
		border-radius: 12px;
		padding: 22px 20px;
		overflow-x: auto;
		cursor: zoom-in;
	}
```

Replace the `background` line only:

```scss
	.mqtt-diagram__canvas {
		position: relative;
		background: rgba($color-pe, 0.05);
		border: 1px solid $color-border;
		border-radius: 12px;
		padding: 22px 20px;
		overflow-x: auto;
		cursor: zoom-in;
	}
```

Leave `.mqtt-diagram-modal__inner` (`background: $color-bg-white`) unchanged — enlarged view stays white for max contrast.

- [ ] **Step 2: Standard checks**

Run the standard checks with `<FILES>` = `"src/components/MqttLearn/MqttDiagram.astro"`. Expect prettier clean, `pnpm check` 0 errors, eslint clean.

- [ ] **Step 3: Visual verify**

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1000,2600 --screenshot=/tmp/t1-diagram.png http://localhost:4321/mqtt/what-is-mqtt/
```

Read `/tmp/t1-diagram.png`. Expected: the diagram panel now has a faint green wash; the white actor boxes ("Thermostat", "Dashboard", …) stand out against it; border/rounded corners/zoom affordance intact.

- [ ] **Step 4: Leave working tree clean (NO commit — see COMMIT POLICY).**

---

### Task 2: `LearnFeatureGrid` component + wire the "Why MQTT" section

**Files:**
- Create: `src/components/MqttLearn/LearnFeatureGrid.astro`
- Modify: `src/pages/mqtt/what-is-mqtt.astro` (frontmatter + the "Why MQTT is used for IoT" `<ul>`, ~lines 84-105)

**Interfaces:**
- Produces: `LearnFeatureGrid` with prop `features: { icon: string; title: string; text: string }[]`. `icon` is a tabler name; `text` is plain text (no inline markup).

- [ ] **Step 1: Create the component**

Create `src/components/MqttLearn/LearnFeatureGrid.astro`:

```astro
---
import { Icon } from 'astro-icon/components';

interface Feature {
	/** astro-icon tabler name, e.g. 'tabler:feather' */
	icon: string;
	title: string;
	/** plain text — no inline markup */
	text: string;
}
interface Props {
	features: Feature[];
}
const { features } = Astro.props;
---

<div class="learn-feature-grid">
	{
		features.map((f) => (
			<div class="learn-feature">
				<span class="learn-feature__ic">
					<Icon name={f.icon} />
				</span>
				<h3 class="learn-feature__title">{f.title}</h3>
				<p class="learn-feature__text">{f.text}</p>
			</div>
		))
	}
</div>

<style lang="scss">
	@use '../../styles/variables' as *;

	.learn-feature-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: $spacing-4;
		margin: $spacing-4 0 $spacing-6;
		@include media-up(sm) {
			grid-template-columns: 1fr 1fr;
		}
	}
	.learn-feature {
		background: $color-bg-white;
		border: 1px solid $color-border;
		border-radius: $radius-xl;
		padding: 20px 22px;
	}
	.learn-feature__ic {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: $radius-lg;
		background: rgba($color-pe, 0.1);
		color: $color-pe-link;
		margin-bottom: 12px;
	}
	:global(.learn-feature__ic svg) {
		width: 20px;
		height: 20px;
	}
	.learn-feature__title {
		font-size: 16px;
		font-weight: $font-weight-semibold;
		color: $color-text-primary;
		margin: 0 0 6px;
	}
	.learn-feature__text {
		font-size: 14.5px;
		line-height: 1.55;
		color: $color-text-secondary;
		margin: 0;
	}
</style>
```

- [ ] **Step 2: Import + add the features data in the page frontmatter**

In `src/pages/mqtt/what-is-mqtt.astro`, add to the imports (after the existing `MqttDiagram` import):

```astro
import LearnFeatureGrid from '@components/MqttLearn/LearnFeatureGrid.astro';
```

Add this const inside the frontmatter (after the `faq` array):

```astro
const whyFeatures = [
	{
		icon: 'tabler:feather',
		title: 'Lightweight',
		text: 'A compact fixed header — just 2 bytes at minimum — keeps overhead and battery use low.',
	},
	{
		icon: 'tabler:refresh-alert',
		title: 'Resilient',
		text: 'Persistent connections, QoS levels, and Last Will messages handle flaky links gracefully.',
	},
	{
		icon: 'tabler:topology-star-3',
		title: 'Scalable',
		text: 'The decoupled pub/sub model lets one broker fan a message out to many subscribers efficiently.',
	},
	{
		icon: 'tabler:database',
		title: 'Stateful when needed',
		text: 'Persistent sessions and retained messages keep clients in sync across reconnects.',
	},
];
```

- [ ] **Step 3: Replace the bullet list with the grid**

In the body, find (the "Why MQTT is used for IoT" `<ul>`):

```astro
	<h2>Why MQTT is used for IoT</h2>
	<p>
		MQTT was designed for constrained devices and unreliable networks, which is exactly the environment most IoT fleets
		live in. Its advantages:
	</p>
	<ul>
		<li>
			<strong>Lightweight:</strong> a compact fixed header (just 2 bytes at minimum) keeps overhead and battery use low.
		</li>
		<li>
			<strong>Resilient:</strong> persistent connections, <a href="/mqtt/qos/">Quality of Service</a>
			levels, and <a href="/mqtt/last-will/">Last Will</a> messages handle flaky links gracefully.
		</li>
		<li>
			<strong>Scalable:</strong> the decoupled pub/sub model lets one broker fan a message out to many subscribers efficiently.
		</li>
		<li>
			<strong>Stateful when needed:</strong>
			<a href="/mqtt/persistent-session/">persistent sessions</a> and
			<a href="/mqtt/retained-messages/">retained messages</a> keep clients in sync across reconnects.
		</li>
	</ul>
```

Replace with:

```astro
	<h2>Why MQTT is used for IoT</h2>
	<p>
		MQTT was designed for constrained devices and unreliable networks, which is exactly the environment most IoT fleets
		live in. Its advantages:
	</p>
	<LearnFeatureGrid features={whyFeatures} />
```

(The QoS / Last Will / persistent-session / retained-messages links removed here all still appear in the "Core MQTT concepts" grid below — no navigation is lost.)

- [ ] **Step 4: Standard checks** with `<FILES>` = `"src/components/MqttLearn/LearnFeatureGrid.astro" "src/pages/mqtt/what-is-mqtt.astro"`.

If `pnpm check` errors on an icon name (astro-icon throws for a missing tabler icon), substitute a confirmed name: Resilient → `tabler:shield-check`, Scalable → `tabler:arrows-maximize`. Re-run.

- [ ] **Step 5: Render + visual verify**

```bash
curl -s http://localhost:4321/mqtt/what-is-mqtt/ | grep -o 'learn-feature__title' | head    # expect matches
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1000,2800 --screenshot=/tmp/t2-features.png http://localhost:4321/mqtt/what-is-mqtt/
```

Read `/tmp/t2-features.png`. Expected: a 2×2 card grid (icon chip + title + one line) under "Why MQTT is used for IoT". Confirm 1-column on mobile:

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=420,3200 --screenshot=/tmp/t2-features-mobile.png http://localhost:4321/mqtt/what-is-mqtt/
```

- [ ] **Step 6: Leave working tree clean (NO commit).**

---

### Task 3: `LearnCardGrid` component + wire the "Core concepts" section

**Files:**
- Create: `src/components/MqttLearn/LearnCardGrid.astro`
- Modify: `src/pages/mqtt/what-is-mqtt.astro` (frontmatter + the "Core MQTT concepts" `<ul>`, ~lines 117-136)

**Interfaces:**
- Produces: `LearnCardGrid` with prop `cards: { href: string; title: string; blurb: string }[]`. Visual style matches `RelatedTopics` (border-color hover, no shadow/transform).

- [ ] **Step 1: Create the component**

Create `src/components/MqttLearn/LearnCardGrid.astro`:

```astro
---
interface Card {
	href: string;
	title: string;
	blurb: string;
}
interface Props {
	cards: Card[];
}
const { cards } = Astro.props;
---

<div class="learn-card-grid">
	{
		cards.map((c) => (
			<a class="learn-card" href={c.href}>
				<span class="learn-card__title">{c.title}</span>
				<span class="learn-card__blurb">{c.blurb}</span>
			</a>
		))
	}
</div>

<style lang="scss">
	@use '../../styles/variables' as *;

	.learn-card-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
		margin: $spacing-4 0 $spacing-6;
		@include media-up(sm) {
			grid-template-columns: 1fr 1fr;
		}
	}
	.learn-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: $color-bg-white;
		border: 1px solid $color-border;
		border-radius: $radius-lg;
		padding: 14px 16px;
		text-decoration: none;
		transition: border-color $transition-fast;
		&:hover {
			border-color: $color-pe-dark;
			text-decoration: none;
		}
		&:focus-visible {
			outline: 2px solid $color-pe;
			outline-offset: 2px;
		}
	}
	.learn-card__title {
		font-size: 14.5px;
		font-weight: $font-weight-semibold;
		color: $color-text-primary;
	}
	.learn-card__blurb {
		font-size: 13px;
		line-height: 1.45;
		color: $color-text-secondary;
	}
</style>
```

- [ ] **Step 2: Import + add the cards data in the page frontmatter**

Add to imports:

```astro
import LearnCardGrid from '@components/MqttLearn/LearnCardGrid.astro';
```

Add this const in the frontmatter (after `whyFeatures`):

```astro
const conceptCards = [
	{ href: '/mqtt/mqtt-broker/', title: 'MQTT broker', blurb: 'The central server that routes every message.' },
	{ href: '/mqtt/mqtt-client/', title: 'MQTT clients', blurb: 'The devices and apps that publish and subscribe.' },
	{ href: '/mqtt/publish-subscribe/', title: 'Publish/subscribe', blurb: 'The messaging model MQTT is built on.' },
	{ href: '/mqtt/topics/', title: 'Topics & wildcards', blurb: 'How messages are addressed and matched.' },
	{ href: '/mqtt/mqtt-connection/', title: 'Connection (CONNECT)', blurb: 'How a client opens a session.' },
	{ href: '/mqtt/mqtt-client-id/', title: 'Client ID', blurb: 'How the broker identifies each client.' },
	{ href: '/mqtt/mqtt-packets/', title: 'MQTT packets', blurb: 'The control packets clients and brokers exchange.' },
	{ href: '/mqtt/qos/', title: 'Quality of Service (QoS)', blurb: 'At-most-once, at-least-once, exactly-once delivery.' },
	{ href: '/mqtt/retained-messages/', title: 'Retained messages', blurb: 'The last known value on a topic.' },
	{ href: '/mqtt/last-will/', title: 'Last Will & Testament', blurb: 'Signalling ungraceful disconnects.' },
	{ href: '/mqtt/persistent-session/', title: 'Persistent sessions', blurb: 'Queuing messages for offline clients.' },
	{ href: '/mqtt/mqtt-5/', title: 'MQTT 5.0', blurb: 'The latest version and what it adds.' },
	{ href: '/mqtt/shared-subscriptions/', title: 'Shared subscriptions', blurb: 'Load-balancing consumers.' },
	{ href: '/mqtt/security/', title: 'Security', blurb: 'TLS, authentication, and authorization.' },
];
```

- [ ] **Step 3: Replace the bullet list with the grid**

Find:

```astro
	<h2>Core MQTT concepts</h2>
	<p>Once the pub/sub basics click, these are the concepts worth knowing next:</p>
	<ul>
```

…through its closing `</ul>` (the 14 `<li>` links). Replace the entire `<ul>…</ul>` with:

```astro
	<LearnCardGrid cards={conceptCards} />
```

Keep the `<h2>` and the intro `<p>` as-is.

- [ ] **Step 4: Standard checks** with `<FILES>` = `"src/components/MqttLearn/LearnCardGrid.astro" "src/pages/mqtt/what-is-mqtt.astro"`.

- [ ] **Step 5: Render + visual verify**

```bash
curl -s http://localhost:4321/mqtt/what-is-mqtt/ | grep -c 'learn-card__title'   # expect 14
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1000,3200 --screenshot=/tmp/t3-concepts.png http://localhost:4321/mqtt/what-is-mqtt/
```

Read `/tmp/t3-concepts.png`. Expected: a 2-column grid of 14 link tiles (title + blurb) with green border on hover; matches `RelatedTopics` styling.

- [ ] **Step 6: Leave working tree clean (NO commit).**

---

### Task 4: Rebuild `MqttTopicLayout` — hero band + 3-column grid (all 32 pages)

**Files:**
- Modify: `src/components/MqttLearn/MqttTopicLayout.astro` (template + styles; the scrollspy `<script>` is added in Task 6)

**Interfaces:**
- Consumes: `QuickAnswer`, `HowTbmqBlock` (moved into the rail), `FaqAccordion` (moved into the center column), `RelatedTopics`, `LearnCta`. Same `Props { slug, faq }` — no page-level API change.
- Produces: markup landmarks the Task 6 script depends on: `<aside class="learn-toc" aria-label="On this page">` (empty), `<div class="learn-main"><div class="learn-body"><slot/></div>…</div>`, `<aside class="learn-rail">`.

- [ ] **Step 1: Replace the template `<main>…</main>` block**

In `src/components/MqttLearn/MqttTopicLayout.astro`, replace the entire `<main class="learn-page">…</main>` (currently lines ~38-64) with:

```astro
	<main class="learn-page">
		<div class="learn-hero-band">
			<div class="learn-hero-band__inner">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/">Home</a>
					<span aria-hidden="true">/</span>
					<a href="/mqtt/">Learn</a>
					<span aria-hidden="true">/</span>
					<span aria-current="page">{topic.navLabel}</span>
				</nav>

				<header class="learn-hero">
					<p class="learn-hero__eyebrow">{topic.eyebrow}</p>
					<h1 class="learn-hero__title">{topic.title}</h1>
				</header>

				<QuickAnswer text={topic.quickAnswer} />
			</div>
		</div>

		<div class="learn-layout">
			<aside class="learn-toc" aria-label="On this page">
				{/* Populated client-side by the scrollspy script (Task 6). Empty + hidden without JS. */}
			</aside>

			<div class="learn-main">
				<div class="learn-body">
					<slot />
				</div>
				<FaqAccordion items={faq} />
			</div>

			<aside class="learn-rail">
				<HowTbmqBlock text={topic.tbmqTieIn} />
			</aside>
		</div>

		<div class="learn-foot">
			<RelatedTopics slug={slug} />
			<LearnCta />
		</div>
	</main>
```

- [ ] **Step 2: Replace the layout styles (keep the `.learn-body` prose block verbatim)**

In the `<style lang="scss">` block, replace everything from `.learn-page {` down to the end of `.learn-hero__title { … }` (currently lines ~70-113) with the following. **Do not touch** the `.learn-body { :global(...) }` prose block that follows (currently lines ~116-180) — leave it exactly as-is.

```scss
	.learn-page {
		background: var(--color-bg-surface);
		padding-bottom: $spacing-20;
	}

	// Full-bleed tinted hero band: breadcrumb + eyebrow + H1 + quick answer.
	.learn-hero-band {
		position: relative;
		padding: calc(#{$header-height} + #{$spacing-12}) $spacing-6 $spacing-12;
		background:
			radial-gradient(760px 420px at 50% -40px, rgba($color-pe, 0.12), rgba($color-pe, 0) 68%),
			var(--color-bg-surface);
		border-bottom: 1px solid $color-border;
	}
	.learn-hero-band__inner {
		max-width: 1180px;
		margin: 0 auto;
	}

	.breadcrumb {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		font-size: 14px;
		color: $color-text-muted;
		margin-bottom: $spacing-8;
		a {
			color: $color-text-secondary;
			text-decoration: none;
			&:hover {
				color: $color-pe-link;
			}
		}
	}
	.learn-hero {
		margin-bottom: $spacing-8;
	}
	.learn-hero__eyebrow {
		font-size: 13px;
		font-weight: $font-weight-semibold;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: $color-pe-link;
		margin: 0 0 12px;
	}
	.learn-hero__title {
		font-size: 40px;
		line-height: 1.15;
		font-weight: $font-weight-semibold;
		color: $color-text-primary;
		margin: 0;
		max-width: 20ch;
		@include media-up(md) {
			font-size: 46px;
		}
	}

	// 3-column body: TOC · content · TBMQ rail. Collapses to 1 column < lg.
	.learn-layout {
		max-width: 1180px;
		margin: 0 auto;
		padding: $spacing-12 $spacing-6 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: $spacing-10;
		@include media-up(lg) {
			grid-template-columns: 230px minmax(0, 1fr) 300px;
			gap: $spacing-12;
			align-items: start;
		}
	}
	.learn-main {
		min-width: 0;
		max-width: 760px;
		margin: 0 auto;
		width: 100%;
		@include media-up(lg) {
			max-width: none;
			margin: 0;
		}
	}
	.learn-toc {
		display: none;
		@include media-up(lg) {
			display: block;
			position: sticky;
			top: calc(#{$header-height} + #{$spacing-6});
			align-self: start;
		}
	}
	.learn-rail {
		max-width: 760px;
		margin: 0 auto;
		width: 100%;
		@include media-up(lg) {
			max-width: none;
			margin: 0;
			position: sticky;
			top: calc(#{$header-height} + #{$spacing-6});
			align-self: start;
		}
	}
	.learn-foot {
		max-width: 1180px;
		margin: 0 auto;
		padding: 0 $spacing-6;
	}

	// TOC links are created by JS, so they need :global styling.
	.learn-toc__title {
		font-size: 12px;
		font-weight: $font-weight-semibold;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: $color-text-muted;
		margin: 0 0 12px;
	}
	:global(.learn-toc__link) {
		display: block;
		font-size: 14px;
		line-height: 1.4;
		color: $color-text-muted;
		padding: 6px 0 6px 14px;
		border-left: 2px solid $color-border;
		text-decoration: none;
	}
	:global(.learn-toc__link:hover) {
		color: $color-text-primary;
	}
	:global(.learn-toc__link.is-active) {
		color: $color-pe-link;
		border-left-color: $color-pe;
		font-weight: $font-weight-semibold;
	}
	:global(.learn-toc__link:focus-visible) {
		outline: 2px solid $color-pe;
		outline-offset: 2px;
	}
```

- [ ] **Step 3: Add `scroll-margin-top` to body H2s (so TOC jumps clear the header)**

Inside the existing `.learn-body { … }` block, find `:global(h2) {` and add one line to that rule:

```scss
		:global(h2) {
			font-size: 28px;
			font-weight: $font-weight-semibold;
			color: $color-text-primary;
			margin: $spacing-10 0 $spacing-4;
			scroll-margin-top: calc(#{$header-height} + #{$spacing-4});
		}
```

- [ ] **Step 4: Standard checks** with `<FILES>` = `"src/components/MqttLearn/MqttTopicLayout.astro"`.

- [ ] **Step 5: Visual verify — desktop 3-col, tinted hero, FAQ in center, rail present**

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1300,3400 --screenshot=/tmp/t4-desktop.png http://localhost:4321/mqtt/what-is-mqtt/
```

Read it. Expected: green-tinted hero band across the top; below it three columns — empty left gutter (TOC not populated yet), centered content + FAQ, and the "How TBMQ handles this" card in the right column (still its old wide styling — restyled in Task 5); Related topics + CTA full-width below.

- [ ] **Step 6: Visual verify — mobile single column**

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=420,4200 --screenshot=/tmp/t4-mobile.png http://localhost:4321/mqtt/what-is-mqtt/
```

Expected: one column, no TOC, the TBMQ card sits below the content (where the old full-width block was), content capped ~760.

- [ ] **Step 7: Spot-check a non-upgraded page inherits the frame**

```bash
curl -s http://localhost:4321/mqtt/qos/ -o /dev/null -w "%{http_code}\n"   # expect 200
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1300,3000 --screenshot=/tmp/t4-qos.png http://localhost:4321/mqtt/qos/
```

Expected: `qos` (prose body, not upgraded) shows the same tinted hero + 3-col frame + rail. Confirms the shared-layout rollout.

- [ ] **Step 8: Leave working tree clean (NO commit).**

---

### Task 5: Restyle `HowTbmqBlock` as the sticky rail card

**Files:**
- Modify: `src/components/MqttLearn/HowTbmqBlock.astro` (template actions + styles)

**Interfaces:**
- Consumes: same `Props { text: string; detail?: string }`.
- Produces: same component, now sized/styled for the ~300px rail — buttoned actions + a meta line.

- [ ] **Step 1: Replace the links block with buttoned actions + meta**

In `src/components/MqttLearn/HowTbmqBlock.astro`, replace the `<div class="how-tbmq__links">…</div>` block with:

```astro
	<div class="how-tbmq__actions">
		<a class="how-tbmq__btn how-tbmq__btn--primary" href="/product/">Explore the architecture</a>
		<a class="how-tbmq__btn" href="/docs/mqtt-broker/">Read the docs</a>
	</div>
	<p class="how-tbmq__meta">Free · Apache-2.0 · self-hosted or cloud</p>
```

- [ ] **Step 2: Replace the `<style>` block**

Replace the entire `<style lang="scss">…</style>` with:

```astro
<style lang="scss">
	@use '../../styles/variables' as *;

	.how-tbmq {
		background: #eaf7ef;
		border: 1px solid rgba($color-pe-dark, 0.28);
		border-radius: $radius-xl;
		padding: $spacing-6;
	}
	.how-tbmq__head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;
	}
	.how-tbmq__title {
		font-size: 15px;
		font-weight: $font-weight-semibold;
		color: $color-pe-link;
		margin: 0;
	}
	.how-tbmq__text {
		font-size: 14px;
		line-height: 1.6;
		color: $color-text-secondary;
		margin: 0 0 $spacing-4;
	}
	.how-tbmq__actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.how-tbmq__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 10px 16px;
		border-radius: $radius-lg;
		font-size: 14px;
		font-weight: $font-weight-medium;
		text-decoration: none;
		border: 1px solid $color-border;
		background: $color-bg-white;
		color: $color-text-primary;
		&:hover {
			border-color: $color-text-muted;
			text-decoration: none;
		}
		&:focus-visible {
			outline: 2px solid $color-pe;
			outline-offset: 2px;
		}
	}
	.how-tbmq__btn--primary {
		background: $color-pe;
		border-color: $color-pe;
		color: $color-bg-white;
		&:hover {
			background: $color-pe-hover;
			border-color: $color-pe-hover;
		}
	}
	.how-tbmq__meta {
		font-size: 12px;
		color: $color-text-muted;
		text-align: center;
		margin: 12px 0 0;
	}
	:global(.how-tbmq__icon) {
		width: 18px;
		height: 18px;
		color: $color-pe-dark;
		flex-shrink: 0;
	}
</style>
```

- [ ] **Step 3: Standard checks** with `<FILES>` = `"src/components/MqttLearn/HowTbmqBlock.astro"`.

- [ ] **Step 4: Visual verify the rail card (desktop + mobile)**

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1300,3400 --screenshot=/tmp/t5-rail.png http://localhost:4321/mqtt/what-is-mqtt/
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=420,4200 --screenshot=/tmp/t5-rail-mobile.png http://localhost:4321/mqtt/what-is-mqtt/
```

Read both. Expected: right rail = green card with the bolt icon + "How TBMQ handles this" + the topic tie-in + a green "Explore the architecture" button, a ghost "Read the docs" button, and the muted meta line. Fits the ~300px column cleanly; on mobile the same card sits below content, full width (≤760).

- [ ] **Step 5: Leave working tree clean (NO commit).**

---

### Task 6: Auto-build the TOC + scrollspy

**Files:**
- Modify: `src/components/MqttLearn/MqttTopicLayout.astro` (add a `<script>` after the `</BaseLayout>` close, before the `<style>` block)

**Interfaces:**
- Consumes: DOM landmarks from Task 4 (`.learn-toc`, `.learn-body h2`) and the `:global(.learn-toc__*)` styles from Task 4.
- Produces: at runtime, `<p class="learn-toc__title">On this page</p>` + one `<a class="learn-toc__link" href="#id">` per body H2, with `.is-active` + `aria-current="true"` tracking scroll.

- [ ] **Step 1: Add the script**

In `src/components/MqttLearn/MqttTopicLayout.astro`, immediately after `</BaseLayout>` and before `<style lang="scss">`, add:

```astro
<script>
	// Build the left TOC rail from the page's body H2s and highlight the active
	// section on scroll. Progressive enhancement: no JS → the rail stays empty
	// (and is display:none < lg anyway), content unaffected.
	function buildLearnToc() {
		const toc = document.querySelector('.learn-toc') as HTMLElement | null;
		const body = document.querySelector('.learn-body') as HTMLElement | null;
		if (!toc || !body || toc.dataset.ready) return;

		const heads = Array.from(body.querySelectorAll('h2'));
		if (!heads.length) return;

		const slugify = (s: string) =>
			s
				.toLowerCase()
				.trim()
				.replace(/[^\w]+/g, '-')
				.replace(/^-+|-+$/g, '');

		const used = new Set<string>();
		const links: HTMLAnchorElement[] = [];

		heads.forEach((h) => {
			const base = h.id || slugify(h.textContent || '');
			if (!base) return;
			let id = base;
			let n = 2;
			while (used.has(id)) id = `${base}-${n++}`;
			used.add(id);
			h.id = id;

			const a = document.createElement('a');
			a.href = `#${id}`;
			a.className = 'learn-toc__link';
			a.textContent = h.textContent || '';
			links.push(a);
		});
		if (!links.length) return;

		const title = document.createElement('p');
		title.className = 'learn-toc__title';
		title.textContent = 'On this page';
		toc.append(title, ...links);
		toc.dataset.ready = 'true';

		const setActive = (id: string) => {
			links.forEach((a) => {
				const on = a.getAttribute('href') === `#${id}`;
				a.classList.toggle('is-active', on);
				if (on) a.setAttribute('aria-current', 'true');
				else a.removeAttribute('aria-current');
			});
		};

		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) setActive((e.target as HTMLElement).id);
				});
			},
			{ rootMargin: '-96px 0px -70% 0px' },
		);
		heads.forEach((h) => io.observe(h));
	}

	buildLearnToc();
	document.addEventListener('astro:page-load', buildLearnToc);
</script>
```

- [ ] **Step 2: Standard checks** with `<FILES>` = `"src/components/MqttLearn/MqttTopicLayout.astro"`. (`pnpm check` also type-checks the inline TS.)

- [ ] **Step 3: Verify the TOC populates + scrollspy (desktop)**

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1300,2000 --screenshot=/tmp/t6-toc.png http://localhost:4321/mqtt/what-is-mqtt/
```

Read `/tmp/t6-toc.png`. Expected: left rail shows "ON THIS PAGE" + links — "How MQTT works", "Why MQTT is used for IoT", "MQTT vs HTTP", "Core MQTT concepts" — with the first active (green text + green left-border). ("Frequently asked questions" is intentionally excluded — the TOC reads only `.learn-body` H2s, and the FAQ heading is outside the body slot.)

- [ ] **Step 4: Verify no-JS degradation is graceful**

Confirm by reading the source that the rail is empty in SSR output and hidden < lg:

```bash
curl -s http://localhost:4321/mqtt/what-is-mqtt/ | grep -o 'class="learn-toc"[^>]*>' | head    # empty nav present
```

Expected: the `<aside class="learn-toc">` exists but contains no links in the HTML source (JS fills it) — so without JS the page is unaffected.

- [ ] **Step 5: Leave working tree clean (NO commit).**

---

### Task 7: Full verification pass + commit (APPROVAL-GATED)

**Files:** none (verification + git only)

- [ ] **Step 1: Full static checks across all touched files**

```bash
cd /home/dlandiak/projects/tbmq.io
pnpm exec prettier --write \
  src/components/MqttLearn/MqttDiagram.astro \
  src/components/MqttLearn/LearnFeatureGrid.astro \
  src/components/MqttLearn/LearnCardGrid.astro \
  src/components/MqttLearn/MqttTopicLayout.astro \
  src/components/MqttLearn/HowTbmqBlock.astro \
  src/pages/mqtt/what-is-mqtt.astro
pnpm check          # 0 errors
pnpm lint:eslint    # clean
pnpm lint:slugcheck # clean
```

- [ ] **Step 2: Keyboard + reduced-motion spot check**

Read `/tmp/t6-toc.png` and confirm focus styling is defined (outlines on `.learn-toc__link`, `.how-tbmq__btn`, `.learn-card` — all present from Tasks 3/4/5). Confirm no unconditional transitions were added that ignore `prefers-reduced-motion` (the only transitions are `border-color` on cards/rail, which are color-only and motion-safe; the diagram modal's scale animation is already gated).

- [ ] **Step 3: Final desktop + mobile screenshots of the finished page**

```bash
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1300,3600 --screenshot=/tmp/final-desktop.png http://localhost:4321/mqtt/what-is-mqtt/
google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=420,4600 --screenshot=/tmp/final-mobile.png http://localhost:4321/mqtt/what-is-mqtt/
```

Read both; confirm all five requirements: 3-col→1-col, tinted hero, tinted diagram + tinted card blocks, feature grid + concept grid, sticky TOC + sticky rail.

- [ ] **Step 4: STOP — present screenshots to the user and get explicit approval to commit.** Per the COMMIT POLICY, do not proceed to Step 5 until the user says to commit.

- [ ] **Step 5: Commit (only after approval)**

Optionally branch first (`git checkout -b feat/mqtt-learn-redesign`) if the user prefers not to commit on `develop`. Then:

```bash
git add \
  src/components/MqttLearn/MqttDiagram.astro \
  src/components/MqttLearn/LearnFeatureGrid.astro \
  src/components/MqttLearn/LearnCardGrid.astro \
  src/components/MqttLearn/MqttTopicLayout.astro \
  src/components/MqttLearn/HowTbmqBlock.astro \
  src/pages/mqtt/what-is-mqtt.astro \
  docs/superpowers/specs/2026-07-22-mqtt-learn-redesign-design.md \
  docs/superpowers/plans/2026-07-22-mqtt-learn-redesign.md
git commit -m "feat(mqtt-learn): 3-column redesign of the learn topic layout"
```

- [ ] **Step 6: (Optional, if the user asks) build gate**

Per repo policy, ask before building. If approved: `pnpm build:fast` then `pnpm lint:linkcheck:nobuild` — expect a clean build and no link issues (the concept-grid hrefs and rail links all point at existing pages).

---

## Notes / out of scope

- The other 31 topic pages get the new frame automatically and keep their prose bodies. Upgrading their bodies to card grids is a later, per-page pass — not part of this plan.
- No changes to nav, footer, the dark CTA band, `RelatedTopics`, `LearnCta`, or the hub (`/mqtt/index`).
- FAQ is intentionally not in the TOC (the TOC reads only `.learn-body` H2s). If wanted later, the Task 6 script can be extended to append a "FAQ" link when the FAQ section is present.

## Self-review

- **Spec coverage:** 3-col layout → Task 4; mobile collapse → Task 4 (media-down(lg)); tinted hero → Task 4; section rhythm (tint structured blocks) → diagram Task 1, feature/concept card backgrounds Tasks 2/3; feature-card grid → Task 2; concept card grid → Task 3; diagram tinted panel → Task 1; sticky TOC + scrollspy → Tasks 4 (markup/styles) + 6 (script); sticky TBMQ rail (repurposed `HowTbmqBlock`, full-width removed) → Tasks 4 + 5; keep all 14 concept links → Task 3; no new hex → all tints are `rgba()` of tokens or the pre-existing `#eaf7ef`; a11y/reduced-motion/keyboard → focus outlines Tasks 3/4/5, motion-safe transitions, Task 2/7 checks; reuse tokens/components/icons → throughout. All spec requirements map to a task.
- **Placeholder scan:** none — every code step shows complete code; icon-fallback names are given inline in Task 2.
- **Type/name consistency:** `features`/`Feature{icon,title,text}` (Task 2) and `cards`/`Card{href,title,blurb}` (Task 3) match their usage on `what-is-mqtt`; landmark classes `.learn-toc` / `.learn-body` / `.learn-main` / `.learn-rail` produced in Task 4 are exactly what Task 6's script queries; `.learn-toc__link` / `.is-active` styled in Task 4 match the classes the Task 6 script sets.
