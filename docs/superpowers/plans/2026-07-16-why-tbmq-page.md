# Why-TBMQ (`/product/`) Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new indexable marketing landing at `/product/` ("Why TBMQ") that tells the architecture / why-it-scales story, differentiated from the homepage.

**Architecture:** A static Astro page (`src/pages/product/index.astro`) rendering six section components under `src/components/Product/`, mirroring the existing `/performance/` landing's structure, styling, and SEO wiring. All content is adapted (marketing-framed) from `src/content/_includes/docs/mqtt-broker/why-tbmq.mdx`; architecture depth links to the docs rather than restating them.

**Tech Stack:** Astro + Starlight, SCSS (shared mixins in `src/styles/_variables.scss`), `astro-icon` (tabler icons), `SmartImage` for optimized images.

## Global Constraints

- **Tabs for indentation** in `.astro`/`.ts`/`.scss` code (spaces only for JSON/MD/YAML). Match surrounding style; Prettier printWidth 100, single quotes.
- **Never hardcode font values** — use the SCSS mixins from `_variables.scss` (`@include page-title`, `@include container`, `@include media-up(...)`, etc.).
- **Theme-dependent colors** via CSS custom properties or the shared `$color-*` SCSS vars already used by sibling components — follow the `/performance/` components exactly.
- **Path aliases:** `@components/*`, `@layouts/*`, `@models/*`, `~/*` (→ `src/*`). SCSS `@use` uses **relative** paths (`../../styles/variables` from a component, `../styles/variables` from a page). There is **no** `@util` alias — import util modules via `~/util/...`.
- **Accent:** PE green — `--tb-main-color: #{$color-pe}` / `--tb-main-color-hover: #{$color-pe-dark}` scoped to `#product` (same as `/performance/`).
- **Page shell:** `forceLightTheme`, `pageId="product"`, `gitHubPlatform={Products.TBMQ}` (same as `/performance/`).
- **Merge-safety:** additive only. Allowed to edit these TBMQ-local files: `src/util/ogContext.ts`, `src/components/Landing/HeaderContent.astro`. Do NOT touch shared upstream files (Products enum, `versions.ts`, `astro.sidebar.ts`, redirect tables, content schemas).
- **CE-first links:** doc/getting-started links use the CE tree (`/docs/mqtt-broker/...`), NOT `/docs/mqtt-broker/pe/...` (open-source-front-door decision).
- **No fabricated claims.** Numbers (3M+ msg/sec, 100M connections) come from published perf tests only.
- **Verification cycle** (this is a static site — no unit-test framework for pages): each task ends by building/rendering and visually/HTML-verifying, then committing. Use `pnpm build:fast` for structural verification (**ask the user before running any build**, per project policy) or `pnpm dev` render. Final task runs the full check suite.

---

### Task 1: Page scaffold + ProductHero + SEO + wiring

Creates the route, the dark hero with stat strip and CTAs, all SEO metadata, the OG allowlist entry, and the `HeaderContent.astro` dark-hero registration. After this task, `/product/` exists, is indexable, renders the hero, and the nav renders correctly over the dark hero.

**Files:**
- Create: `src/components/Product/ProductHero.astro`
- Create: `src/pages/product/index.astro`
- Modify: `src/util/ogContext.ts` (add `'/product/'` to `MARKETING_ALLOWLIST`)
- Modify: `src/components/Landing/HeaderContent.astro` (register `#product` at 5 sites)

**Interfaces:**
- Produces: `ProductHero.astro` (no props). Page `index.astro` renders `<main>` with section components. The page defines `title`, `description`, `jsonLd`, and passes them to `BaseLayout`.

- [ ] **Step 1: Create `ProductHero.astro`**

```astro
---
const stats = [
	{ value: '3M+', label: 'Messages/sec on a single node', href: '/performance/' },
	{ value: '100M', label: 'Concurrent MQTT connections', href: '/performance/' },
	{ value: 'Zero', label: 'Message loss, by design', href: '#architecture-pillars' },
];
---

<section id="product-hero">
	<div class="inner">
		<p class="eyebrow">Why TBMQ</p>
		<h1>The MQTT broker built for real IoT traffic</h1>
		<p class="subtitle">
			TBMQ is an open-source MQTT broker built by the ThingsBoard team from years of running IoT
			infrastructure at scale — engineered so device publishing, high-volume application streams,
			and targeted commands each get a dedicated, fault-tolerant processing path.
		</p>
		<div class="buttons">
			<a class="btn btn-white" href="/installations/">Try it now</a>
			<a class="btn btn-outline" href="/live-demo/">Live demo</a>
		</div>
		<div class="stats">
			{
				stats.map((s) => (
					<a class="stat" href={s.href}>
						<span class="stat-value">{s.value}</span>
						<span class="stat-label">{s.label}</span>
					</a>
				))
			}
		</div>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#product-hero {
		background-color: #00240f;
		padding: calc(#{$header-height} + 64px) $spacing-6 $spacing-20;
	}

	.inner {
		@include container;
		max-width: 1400px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.16em;
		font-size: 14px;
		font-weight: $font-weight-semibold;
		color: $color-pe-hover;
		margin: 0 0 20px;
	}

	h1 {
		@include page-title;
		color: $color-white;
		margin: 0 0 24px;
		text-wrap: balance;
	}

	.subtitle {
		font-size: 18px;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.8);
		margin: 0 0 40px;
		max-width: 820px;

		@include media-up(md) {
			font-size: 20px;
		}
	}

	.buttons {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: 72px;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 28px;
		line-height: 44px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: $font-weight-medium;
		text-decoration: none;
		transition: 0.3s;

		&.btn-white {
			background-color: $color-white;
			color: $color-pe-link;

			&:hover {
				background-color: #e8e8e8;
			}
		}

		&.btn-outline {
			border: 1px solid rgba(255, 255, 255, 0.6);
			color: $color-white;

			&:hover {
				background-color: rgba(255, 255, 255, 0.1);
				border-color: $color-white;
			}
		}
	}

	.stats {
		display: grid;
		grid-template-columns: 1fr;
		gap: 40px 24px;
		width: 100%;
		max-width: 900px;

		@include media-up(md) {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 8px;
		text-decoration: none;

		&:not(:last-child) {
			@include media-up(md) {
				border-right: 1px solid rgba(255, 255, 255, 0.14);
			}
		}
	}

	.stat-value {
		font-size: 44px;
		font-weight: $font-weight-bold;
		line-height: 1.1;
		color: $color-pe-hover;
		font-variant-numeric: tabular-nums;

		@include media-up(md) {
			font-size: 52px;
		}
	}

	.stat-label {
		font-size: 15px;
		line-height: 1.4;
		color: rgba(255, 255, 255, 0.72);
		margin-top: 12px;
		max-width: 20ch;
	}
</style>
```

- [ ] **Step 2: Create `src/pages/product/index.astro`**

(Sections 2–6 are added in later tasks; imports/usages are added as each is built. For now only the hero renders.)

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import ProductHero from '@components/Product/ProductHero.astro';
import { Products } from '@models/site.models';
import { marketingJsonLd } from '~/util/structuredData';

const title = 'Distributed MQTT Broker Architecture – Built to Scale';
const description =
	'TBMQ is a distributed open-source MQTT broker built to scale: Kafka-backed durability, in-memory subscription matching, and a masterless, zero-loss cluster.';
const jsonLd = marketingJsonLd({
	path: '/product/',
	name: title,
	description,
	breadcrumb: 'Product',
});
---

<BaseLayout
	forceLightTheme
	title={title}
	description={description}
	pageId="product"
	gitHubPlatform={Products.TBMQ}
	jsonLd={jsonLd}
	ogImageAlt="TBMQ distributed MQTT broker architecture — built to scale to 100M connections"
>
	<main>
		<ProductHero />
	</main>
</BaseLayout>

<style lang="scss">
	@use '../styles/variables' as *;

	:global(#product) {
		--tb-main-color: #{$color-pe};
		--tb-main-color-hover: #{$color-pe-dark};
	}
</style>
```

- [ ] **Step 3: Add `/product/` to the OG allowlist**

In `src/util/ogContext.ts`, add `'/product/'` to the `MARKETING_ALLOWLIST` array (place it next to `'/performance/'`):

```ts
	'/performance/',
	'/product/',
	'/live-demo/',
```

- [ ] **Step 4: Register `#product` as a dark-hero page in `HeaderContent.astro`**

There are **5 sites** to edit. At each of the **four** selector groups that read:

```scss
	#performance,
	#live-demo,
```

insert a `#product,` line so the group becomes:

```scss
	#performance,
	#live-demo,
	#product,
```

Then in the **`$no-dark-pages`** SCSS string (one line), add `#product` to the comma-separated list (e.g. after `#live-demo`):

```scss
	$no-dark-pages: '..., #performance, #live-demo, #product, #choose-region, #google-iot-core-alternative';
```

Verify with: `grep -n "#product" src/components/Landing/HeaderContent.astro` → expect **5** matches.

- [ ] **Step 5: Verify the page builds and renders**

Ask the user to run (or run if pre-approved): `pnpm build:fast`
Expected: build succeeds, page count increases by 1 vs. the previous build, no errors.
Alternatively verify in `pnpm dev` at `http://localhost:4321/product/`: dark hero renders, three stats show, nav bar is legible over the dark hero (not dark-on-dark), CTAs point to `/installations/` and `/live-demo/`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Product/ProductHero.astro src/pages/product/index.astro src/util/ogContext.ts src/components/Landing/HeaderContent.astro
git commit -m "feat(product): scaffold /product/ page with hero, SEO, and nav wiring"
```

---

### Task 2: TrafficPatterns section

"Purpose-built for IoT traffic" — the thesis that motivates the architecture. Three cards for fan-in / fan-out / point-to-point.

**Files:**
- Create: `src/components/Product/TrafficPatterns.astro`
- Modify: `src/pages/product/index.astro` (import + render after `ProductHero`)

**Interfaces:**
- Consumes: `SectionHeader` from `@components/Landing/SectionHeader.astro` (props: `title: string`, `subtitle?: string`, `align?`, `theme?`), `Icon` from `astro-icon/components`.
- Produces: `TrafficPatterns.astro` (no props).

**Note on icons:** Use tabler icons (not the large `fan-in/fan-out/p2p.svg` scene illustrations, which are sized for full-width scenario blocks and look wrong in a compact card row). `astro-icon` fails the build on an unknown icon name, so if any name below is rejected, substitute a valid tabler icon of similar meaning.

- [ ] **Step 1: Create `TrafficPatterns.astro`**

```astro
---
import SectionHeader from '@components/Landing/SectionHeader.astro';
import { Icon } from 'astro-icon/components';

const patterns = [
	{
		icon: 'tabler:arrow-merge',
		title: 'Fan-in',
		text: 'Millions of devices publish telemetry continuously. A few backend applications must consume every message in order — even during spikes or partial outages.',
	},
	{
		icon: 'tabler:broadcast',
		title: 'Fan-out',
		text: 'A single update or command must reach many subscribed devices at once. One message in, many deliveries out — and every subscriber receives it.',
	},
	{
		icon: 'tabler:arrows-right-left',
		title: 'Point-to-point',
		text: 'A publisher targets one subscriber through a unique topic. Command-response and remote-control flows need low-latency, targeted delivery.',
	},
];
---

<section id="traffic-patterns">
	<div class="inner">
		<SectionHeader
			title="Purpose-built for IoT traffic"
			subtitle="IoT traffic isn't uniform. Most brokers treat every message the same. TBMQ gives each pattern its own processing path."
		/>
		<div class="cards">
			{
				patterns.map((p) => (
					<div class="card">
						<span class="card-icon">
							<Icon name={p.icon} />
						</span>
						<h3 class="card-title">{p.title}</h3>
						<p class="card-text">{p.text}</p>
					</div>
				))
			}
		</div>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#traffic-patterns {
		padding: $spacing-20 $spacing-6;
	}

	.inner {
		@include container;
		max-width: 1200px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 32px;
		width: 100%;

		@include media-up(md) {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.card {
		background: var(--color-bg-surface);
		border-radius: 16px;
		padding: 32px;
		box-shadow: 0 7px 32px 0 rgba(0, 0, 0, 0.08);
	}

	.card-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 14px;
		border: 1px solid $color-pe;
		color: $color-pe;
		margin-bottom: 20px;

		:global(svg) {
			width: 28px;
			height: 28px;
		}
	}

	.card-title {
		font-size: 22px;
		font-weight: $font-weight-semibold;
		color: $color-text-primary;
		margin: 0 0 12px;
	}

	.card-text {
		font-size: 16px;
		line-height: 1.7;
		color: $color-text-secondary;
		margin: 0;
	}
</style>
```

- [ ] **Step 2: Render it in the page**

In `src/pages/product/index.astro`, add the import and place `<TrafficPatterns />` after `<ProductHero />`:

```astro
import ProductHero from '@components/Product/ProductHero.astro';
import TrafficPatterns from '@components/Product/TrafficPatterns.astro';
```

```astro
	<main>
		<ProductHero />
		<TrafficPatterns />
	</main>
```

- [ ] **Step 3: Verify**

`pnpm dev` → `/product/`: section renders below hero, three cards, icons visible (green), responsive (1 col mobile / 3 col desktop). If a build was pre-approved, `pnpm build:fast` succeeds (astro-icon would fail here if an icon name is invalid).

- [ ] **Step 4: Commit**

```bash
git add src/components/Product/TrafficPatterns.astro src/pages/product/index.astro
git commit -m "feat(product): add traffic-patterns section"
```

---

### Task 3: ArchitecturePillars section (with diagram)

"Architecture that backs the numbers" — the four architecture differentiators plus the existing docs architecture diagram. Carries the `#architecture-pillars` anchor targeted by the hero's message-loss stat.

**Files:**
- Create: `src/components/Product/ArchitecturePillars.astro`
- Modify: `src/pages/product/index.astro`

**Interfaces:**
- Consumes: `SectionHeader`, `SmartImage` from `@components/SmartImage.astro` (props: `src`, `alt`, `width`, `height`, `loading`, `class`), `Icon`.
- Produces: `ArchitecturePillars.astro` (no props); section element carries `id="architecture-pillars"`.

- [ ] **Step 1: Create `ArchitecturePillars.astro`**

```astro
---
import SectionHeader from '@components/Landing/SectionHeader.astro';
import SmartImage from '@components/SmartImage.astro';
import { Icon } from 'astro-icon/components';

const pillars = [
	{
		title: 'No message loss by design',
		text: "TBMQ doesn't acknowledge a publish until Kafka has durably stored it. If a node fails mid-flight, another resumes from Kafka — nothing is lost between acknowledgment and delivery.",
	},
	{
		title: 'Subscription matching at any scale',
		text: 'Subscriptions live in an in-memory trie. Lookup time depends on topic length, not subscriber count — a million subscriptions match as fast as a thousand.',
	},
	{
		title: 'Separate paths for publishers and subscribers',
		text: 'DEVICE clients (Redis-backed) and APPLICATION clients (dedicated Kafka topic + consumer thread) are processed independently, so a device spike never delays application delivery.',
	},
	{
		title: 'Symmetric cluster, no coordinator',
		text: 'Every node is identical — no master, no leader election. State is shared through Kafka, so new nodes join and rebalance with zero downtime.',
	},
];
---

<section id="architecture-pillars">
	<div class="inner">
		<SectionHeader
			title="Architecture that backs the numbers"
			subtitle="TBMQ's throughput and resilience are consequences of its design — not a lucky benchmark run."
		/>
		<SmartImage
			class="diagram"
			src="/src/assets/images/docs/mqtt-broker/architecture/tbmq-architecture.png"
			alt="TBMQ architecture: devices and applications connect through Netty to the Message Dispatcher Service, backed by Kafka, an actor system, and an in-memory subscription trie."
			width={1504}
			height={648}
			loading="lazy"
		/>
		<div class="pillars">
			{
				pillars.map((p) => (
					<div class="pillar">
						<h3 class="pillar-title">{p.title}</h3>
						<p class="pillar-text">{p.text}</p>
					</div>
				))
			}
		</div>
		<a class="arch-link" href="/docs/mqtt-broker/architecture/">
			See the full architecture
			<Icon name="tabler:arrow-right" class="link-icon" />
		</a>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#architecture-pillars {
		padding: $spacing-20 $spacing-6;
		background-color: var(--color-bg-surface);
		scroll-margin-top: calc(#{$header-height} + 24px);
	}

	.inner {
		@include container;
		max-width: 1200px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	:global(.diagram) {
		width: 100%;
		max-width: 1000px;
		height: auto;
		margin-bottom: 56px;
	}

	.pillars {
		display: grid;
		grid-template-columns: 1fr;
		gap: 40px 48px;
		width: 100%;

		@include media-up(md) {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.pillar {
		border-left: 3px solid $color-pe-dark;
		padding-left: 24px;
	}

	.pillar-title {
		font-size: 22px;
		font-weight: $font-weight-semibold;
		line-height: 1.3;
		color: $color-text-primary;
		margin: 0 0 10px;
	}

	.pillar-text {
		font-size: 16px;
		line-height: 1.7;
		color: $color-text-secondary;
		margin: 0;
	}

	.arch-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 56px;
		font-size: 18px;
		font-weight: $font-weight-medium;
		color: $color-pe-link;
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	:global(.link-icon) {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
</style>
```

- [ ] **Step 2: Render it in the page**

```astro
import TrafficPatterns from '@components/Product/TrafficPatterns.astro';
import ArchitecturePillars from '@components/Product/ArchitecturePillars.astro';
```

```astro
		<ProductHero />
		<TrafficPatterns />
		<ArchitecturePillars />
```

- [ ] **Step 3: Verify**

`pnpm dev` → `/product/`: diagram renders (light background, green boxes), four pillar cards in 2 columns (desktop), "See the full architecture" link present. Click the hero "Zero message loss" stat → page scrolls to this section and it clears the fixed header (via `scroll-margin-top`).

- [ ] **Step 4: Commit**

```bash
git add src/components/Product/ArchitecturePillars.astro src/pages/product/index.astro
git commit -m "feat(product): add architecture-pillars section with diagram"
```

---

### Task 4: BuiltOn section

"Built on proven foundations" — Kafka, Netty, Actors, Trie, one line each.

**Files:**
- Create: `src/components/Product/BuiltOn.astro`
- Modify: `src/pages/product/index.astro`

**Interfaces:**
- Consumes: `SectionHeader`.
- Produces: `BuiltOn.astro` (no props).

- [ ] **Step 1: Create `BuiltOn.astro`**

```astro
---
import SectionHeader from '@components/Landing/SectionHeader.astro';

const foundations = [
	{ name: 'Apache Kafka', text: 'Durable message storage and distribution across the cluster.' },
	{ name: 'Netty', text: 'Non-blocking, event-driven network transport for millions of connections per node.' },
	{ name: 'Actor system', text: 'Isolated per-client concurrency, so one slow client never blocks another.' },
	{ name: 'In-memory trie', text: 'Subscription matching in time proportional to topic length, not subscriber count.' },
];
---

<section id="built-on">
	<div class="inner">
		<SectionHeader
			title="Built on proven foundations"
			subtitle="Each technology choice directly determines how the broker behaves under load, during failures, and as the cluster grows."
		/>
		<div class="grid">
			{
				foundations.map((f) => (
					<div class="item">
						<h3 class="item-name">{f.name}</h3>
						<p class="item-text">{f.text}</p>
					</div>
				))
			}
		</div>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#built-on {
		padding: $spacing-20 $spacing-6;
	}

	.inner {
		@include container;
		max-width: 1200px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		width: 100%;

		@include media-up(md) {
			grid-template-columns: repeat(2, 1fr);
		}

		@include media-up(lg) {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.item {
		background: var(--color-bg-surface);
		border-radius: 14px;
		padding: 28px 24px;
		box-shadow: 0 7px 32px 0 rgba(0, 0, 0, 0.06);
	}

	.item-name {
		font-size: 19px;
		font-weight: $font-weight-semibold;
		color: $color-text-primary;
		margin: 0 0 10px;
	}

	.item-text {
		font-size: 15px;
		line-height: 1.6;
		color: $color-text-secondary;
		margin: 0;
	}
</style>
```

- [ ] **Step 2: Render it in the page**

```astro
import ArchitecturePillars from '@components/Product/ArchitecturePillars.astro';
import BuiltOn from '@components/Product/BuiltOn.astro';
```

```astro
		<ArchitecturePillars />
		<BuiltOn />
```

- [ ] **Step 3: Verify**

`pnpm dev` → `/product/`: four foundation cards, 4-col desktop / 2-col tablet / 1-col mobile.

- [ ] **Step 4: Commit**

```bash
git add src/components/Product/BuiltOn.astro src/pages/product/index.astro
git commit -m "feat(product): add built-on foundations section"
```

---

### Task 5: Compliance + capabilities section

"Full MQTT compliance" — version support, a compact capability list, and an honest CE/PE note.

**Files:**
- Create: `src/components/Product/Compliance.astro`
- Modify: `src/pages/product/index.astro`

**Interfaces:**
- Consumes: `SectionHeader`, `Icon`.
- Produces: `Compliance.astro` (no props).

- [ ] **Step 1: Create `Compliance.astro`**

```astro
---
import SectionHeader from '@components/Landing/SectionHeader.astro';
import { Icon } from 'astro-icon/components';

const versions = ['MQTT 3.1', 'MQTT 3.1.1', 'MQTT 5.0'];

const capabilities = [
	'Multi-node clustering',
	'X.509, JWT, and HTTP authentication',
	'Access control lists (ACL)',
	'REST API for sessions & subscriptions',
	'Rate limiting for message processing',
	'Cluster and client metrics monitoring',
	'MQTT over WebSocket client',
	'HTTP, MQTT, and Kafka integrations',
	'MQTT channel backpressure',
	'Blocked & unauthorized client management',
];
---

<section id="compliance">
	<div class="inner">
		<SectionHeader
			title="Full MQTT compliance"
			subtitle="Fully compliant with the MQTT protocol in both single-node and cluster deployments."
		/>
		<div class="versions">
			{versions.map((v) => <span class="version-badge">{v}</span>)}
		</div>
		<ul class="capabilities">
			{
				capabilities.map((c) => (
					<li>
						<Icon name="tabler:check" class="check-icon" />
						<span>{c}</span>
					</li>
				))
			}
		</ul>
		<p class="pe-note">
			TBMQ Professional Edition adds Single Sign-On (SSO), Role-Based Access Control (RBAC), and
			white labeling. <a href="/#comparison-features">Compare editions</a>.
		</p>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#compliance {
		padding: $spacing-20 $spacing-6;
		background-color: var(--color-bg-surface);
	}

	.inner {
		@include container;
		max-width: 1000px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.versions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		justify-content: center;
		margin-bottom: 48px;
	}

	.version-badge {
		display: inline-flex;
		align-items: center;
		padding: 8px 18px;
		border-radius: 999px;
		border: 1px solid $color-pe;
		color: $color-pe-link;
		font-size: 15px;
		font-weight: $font-weight-medium;
	}

	.capabilities {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px 40px;
		width: 100%;

		@include media-up(md) {
			grid-template-columns: repeat(2, 1fr);
		}

		li {
			display: flex;
			align-items: flex-start;
			gap: 12px;
			font-size: 16px;
			line-height: 1.5;
			color: $color-text-secondary;
		}
	}

	:global(.check-icon) {
		width: 20px;
		height: 20px;
		color: $color-pe;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.pe-note {
		margin: 48px 0 0;
		font-size: 15px;
		line-height: 1.6;
		color: $color-text-secondary;
		text-align: center;

		a {
			color: $color-pe-link;
			font-weight: $font-weight-medium;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}
</style>
```

- [ ] **Step 2: Render it in the page**

```astro
import BuiltOn from '@components/Product/BuiltOn.astro';
import Compliance from '@components/Product/Compliance.astro';
```

```astro
		<BuiltOn />
		<Compliance />
```

- [ ] **Step 3: Verify**

`pnpm dev` → `/product/`: three version badges, capability list in 2 columns with green check icons, PE note with a working link to `/#comparison-features`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Product/Compliance.astro src/pages/product/index.astro
git commit -m "feat(product): add MQTT compliance & capabilities section"
```

---

### Task 6: ProductCta section

Closing dark CTA — Get started (CE) + Read the architecture.

**Files:**
- Create: `src/components/Product/ProductCta.astro`
- Modify: `src/pages/product/index.astro`

**Interfaces:**
- Consumes: `Icon`.
- Produces: `ProductCta.astro` (no props).

- [ ] **Step 1: Create `ProductCta.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
---

<section id="product-cta">
	<div class="inner">
		<h2>Start building with TBMQ</h2>
		<p>
			The same broker that scales to 100 million connections runs on a single laptop for
			development. Get started in minutes.
		</p>
		<div class="buttons">
			<a class="btn btn-white" href="/docs/mqtt-broker/getting-started/">
				Get started
				<Icon name="tabler:arrow-up-right" class="btn-icon" />
			</a>
			<a class="btn btn-outline" href="/docs/mqtt-broker/architecture/">Read the architecture</a>
		</div>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#product-cta {
		background-color: #00240f;
		padding: 120px $spacing-6;
	}

	.inner {
		@include container;
		max-width: 900px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;

		h2 {
			font-size: 42px;
			font-weight: $font-weight-semibold;
			color: $color-white;
			line-height: 1.2;
			margin: 0 0 24px;

			@include media-down(md) {
				font-size: 32px;
			}
		}

		p {
			font-size: 18px;
			line-height: 1.7;
			color: rgba(255, 255, 255, 0.8);
			margin: 0 0 40px;
			max-width: 640px;
		}
	}

	.buttons {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 28px;
		line-height: 44px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: $font-weight-medium;
		text-decoration: none;
		transition: 0.3s;

		&.btn-white {
			background-color: $color-white;
			color: $color-pe-link;

			&:hover {
				background-color: #e8e8e8;
			}
		}

		&.btn-outline {
			border: 1px solid rgba(255, 255, 255, 0.6);
			color: $color-white;

			&:hover {
				background-color: rgba(255, 255, 255, 0.1);
				border-color: $color-white;
			}
		}
	}

	:global(.btn-icon) {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}
</style>
```

- [ ] **Step 2: Render it in the page (final section order)**

```astro
import Compliance from '@components/Product/Compliance.astro';
import ProductCta from '@components/Product/ProductCta.astro';
```

```astro
	<main>
		<ProductHero />
		<TrafficPatterns />
		<ArchitecturePillars />
		<BuiltOn />
		<Compliance />
		<ProductCta />
	</main>
```

- [ ] **Step 3: Verify**

`pnpm dev` → `/product/`: dark closing CTA renders; "Get started" → `/docs/mqtt-broker/getting-started/`, "Read the architecture" → `/docs/mqtt-broker/architecture/`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Product/ProductCta.astro src/pages/product/index.astro
git commit -m "feat(product): add closing CTA section"
```

---

### Task 7: Full verification pass

Confirm the whole page builds clean, links resolve, types/lint pass, and SEO metadata renders in the HTML.

**Files:** none created; verification + possible small fixes only.

- [ ] **Step 1: Type check + lint**

Run: `pnpm check` → expect no errors.
Run: `pnpm lint:eslint` → expect no errors.

- [ ] **Step 2: Prettier (scoped to touched files only)**

Run: `pnpm exec prettier --write "src/components/Product/**/*.astro" "src/pages/product/index.astro"`
(Do NOT run a repo-wide format.)

- [ ] **Step 3: Build**

Ask the user before running. Run: `pnpm build:fast`
Expected: success; `/product/` in output.

- [ ] **Step 4: Link check**

Run: `pnpm lint:linkcheck` (or `pnpm lint:linkcheck:nobuild` if the build from Step 3 is still present).
Expected: no broken links. The internal links to verify: `/installations/`, `/live-demo/`, `/performance/`, `/#architecture-pillars` (on-page), `/docs/mqtt-broker/architecture/`, `/docs/mqtt-broker/getting-started/`, `/#comparison-features`.

- [ ] **Step 5: Verify SEO metadata in built HTML**

Inspect `dist/product/index.html` (path may be `dist/product/index.html`):
- `<title>` = `Distributed MQTT Broker Architecture – Built to Scale | TBMQ`
- `<meta name="description" ...>` matches the page description
- `<link rel="canonical" href="https://tbmq.io/product/">`
- `<meta property="og:image:alt" ...>` present
- One `<script type="application/ld+json">` containing `"@type":"WebPage"` and `"@type":"BreadcrumbList"` with breadcrumb `Product`
- A per-page OG image URL under `/open-graph/pages/` (not the global fallback), confirming the allowlist entry took effect.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "chore(product): formatting and verification fixes"
```

(If Steps 1–5 produced no changes, skip the commit.)

---

## Notes for the implementer

- **Read `src/components/Performance/BenchmarkHero.astro`, `WhyScales.astro`, and `BenchmarkCta.astro`** — this page deliberately mirrors their structure and SCSS idioms. When in doubt about a class name or mixin, copy their usage.
- **`SmartImage` src** uses the `/src/assets/...` path form (see homepage sections) — it is resolved at build time; do not convert it to an import unless the existing components do.
- **Do not add a nav entry** for `/product/` — that was explicitly deferred.
- If `pnpm build:fast` reports the OG cache is stale, that's fine; it does not affect correctness.
