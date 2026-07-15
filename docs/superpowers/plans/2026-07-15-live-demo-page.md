# /live-demo/ Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, indexable `/live-demo/` marketing landing page and repoint the top-nav "Live Demo" button to it.

**Architecture:** A thin Astro page (`src/pages/live-demo.astro`) on `BaseLayout` composes four purpose-built section components under `src/components/LiveDemo/`. It mirrors the proven `/performance/` page template (dark hero + light content sections, marketing SCSS mixins, `forceLightTheme`). All wiring follows exactly what the `/performance/` commit (`b30f8cff8`) established.

**Tech Stack:** Astro 5 + Starlight, SCSS (project mixins in `src/styles/_variables.scss`), `astro-icon`, vanilla client JS for the status pinger, copy buttons, and connect-tab switcher.

## Global Constraints

- **TBMQ-only, merge-safe.** Only create new files or edit TBMQ-local marketing files. Do **not** touch shared upstream files: `Products` enum, `versions.ts`, `astro.sidebar.ts`, redirect tables, content schemas.
- **Path aliases:** use `@components/*`, `@models/*`, `@layouts/*` for TS/Astro imports (all defined in `tsconfig.json`). SCSS `@use` uses **relative** paths (e.g. `@use '../../styles/variables' as *;`).
- **No hardcoded versions** in code blocks (N/A here — the demo commands use no version strings).
- **Force-light page:** `/live-demo/` does not support dark theme (like `/performance/`); it must be added to every `#performance` selector group in the header.
- **Demo facts (verbatim):** host `demo.tbmq.io`; ports MQTT `1883`, MQTTS `8883`, WS `8084`, WSS `443`; username `demo`; password: none required; CA cert at `/resources/tbmq-demo-root-ca.pem`. Dashboard requires a free account → primary CTA `https://demo.tbmq.io/signup`.
- **Per-task gate:** run `pnpm check` (fast, no build). Reserve `pnpm build:fast` + `pnpm lint:linkcheck` for the final task — and per repo policy, **ask the user before running any build**.
- **Code style:** tabs for indentation in `.astro`/`.ts`/`.scss`; single quotes; conventional-commit messages.

---

## File Structure

- **Create:** `src/pages/live-demo.astro` — route + layout composition.
- **Create:** `src/components/LiveDemo/LiveDemoHero.astro` — hero, status pill, signup CTA.
- **Create:** `src/components/LiveDemo/DashboardTour.astro` — text-only dashboard tour + CTA.
- **Create:** `src/components/LiveDemo/ConnectCard.astro` — connection card + 3-tab mosquitto snippet + safety note + JS (pinger, copy, tabs).
- **Create:** `src/components/LiveDemo/ProductionCta.astro` — "Ready for production?" two-card grid.
- **Modify:** `src/data/navigation.ts` — repoint "Live Demo".
- **Modify:** `src/components/Landing/HeaderContent.astro` — add `#live-demo` to selector groups.
- **Modify:** `src/util/ogContext.ts` — add `/live-demo/` to `MARKETING_ALLOWLIST`.

Build order keeps the route compiling after every task: the page is created together with the hero (Task 1), then each later task adds one component and its import.

---

## Task 1: Page route + hero + nav repoint

**Files:**
- Create: `src/pages/live-demo.astro`
- Create: `src/components/LiveDemo/LiveDemoHero.astro`
- Modify: `src/data/navigation.ts:29`

**Interfaces:**
- Produces: page route `/live-demo/`; `LiveDemoHero` (no props).

- [ ] **Step 1: Create the hero component**

Create `src/components/LiveDemo/LiveDemoHero.astro`:

```astro
---
import { Icon } from 'astro-icon/components';
---

<section id="ld-hero">
	<div class="inner">
		<p class="eyebrow">Live demo</p>
		<h1>Try TBMQ online</h1>
		<p class="subtitle">
			Explore the TBMQ management dashboard with a free demo account, or connect any MQTT
			client to our public broker in seconds — no signup required.
		</p>
		<div class="buttons">
			<a class="btn btn-white" href="https://demo.tbmq.io/signup" target="_blank" rel="noopener noreferrer">
				Create free demo account
				<Icon name="tabler:arrow-up-right" class="btn-icon" />
			</a>
			<a class="btn btn-outline" href="#ld-connect">Or connect a client ↓</a>
		</div>
		<div class="status" data-ld-status aria-live="polite">
			<span class="dot" aria-hidden="true"></span>
			<span class="status-text">Checking demo status…</span>
			<span class="status-host">demo.tbmq.io</span>
		</div>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#ld-hero {
		background-color: #00240f;
		padding: calc(#{$header-height} + 64px) $spacing-6 $spacing-20;
	}

	.inner {
		@include container;
		max-width: 1000px;
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
		max-width: 680px;

		@include media-up(md) {
			font-size: 20px;
		}
	}

	.buttons {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: 48px;
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

	.status {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 8px 16px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		font-size: 14px;
		color: rgba(255, 255, 255, 0.75);
	}

	.status-host {
		font-family: $font-family-mono;
		color: $color-white;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #9aa; // neutral until pinger resolves
		flex-shrink: 0;
	}

	.status.online .dot {
		background: #30d158;
	}

	.status.offline .dot {
		background: #ff453a;
	}

	.status.online .status-text::after {
		content: 'Online';
	}

	.status.offline .status-text::after {
		content: 'Offline';
	}

	// When resolved, hide the "Checking…" text and show the ::after label
	.status.online .status-text,
	.status.offline .status-text {
		font-size: 0;
	}

	.status.online .status-text::after,
	.status.offline .status-text::after {
		font-size: 14px;
	}
</style>
```

> Note: if `$font-family-mono` is not defined in `_variables.scss`, replace it with `var(--sl-font-mono)` or the literal `ui-monospace, monospace`. Verify with: `grep -n "font-family-mono\|font-mono" src/styles/_variables.scss`.

- [ ] **Step 2: Create the page**

Create `src/pages/live-demo.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import LiveDemoHero from '@components/LiveDemo/LiveDemoHero.astro';
import { Products } from '@models/site.models';
---

<BaseLayout
	forceLightTheme
	title="TBMQ Live Demo - Try the Open-Source MQTT Broker Online"
	description="Try TBMQ instantly: explore the management dashboard with a free demo account, or connect any MQTT client to our public broker at demo.tbmq.io — no signup required."
	pageId="live-demo"
	gitHubPlatform={Products.TBMQ}
>
	<main>
		<LiveDemoHero />
	</main>
</BaseLayout>

<style lang="scss">
	@use '../styles/variables' as *;

	:global(#live-demo) {
		--tb-main-color: #{$color-pe};
		--tb-main-color-hover: #{$color-pe-dark};
	}
</style>
```

- [ ] **Step 3: Repoint the nav item**

In `src/data/navigation.ts`, change the first `mainNavItems` entry from:

```ts
	{ label: 'Live Demo', href: 'https://demo.tbmq.io/signup', target: '_blank' },
```

to:

```ts
	{ label: 'Live Demo', href: '/live-demo/' },
```

- [ ] **Step 4: Type-check**

Run: `pnpm check`
Expected: PASS (0 errors). If `$font-family-mono` errored, apply the fallback from Step 1's note and re-run.

- [ ] **Step 5: Commit**

```bash
git add src/pages/live-demo.astro src/components/LiveDemo/LiveDemoHero.astro src/data/navigation.ts
git commit -m "feat(live-demo): add /live-demo/ page with hero and repoint nav"
```

---

## Task 2: Dashboard tour section

**Files:**
- Create: `src/components/LiveDemo/DashboardTour.astro`
- Modify: `src/pages/live-demo.astro` (add import + element)

**Interfaces:**
- Produces: `DashboardTour` (no props).
- Consumes: page composition from Task 1.

- [ ] **Step 1: Create the component**

Create `src/components/LiveDemo/DashboardTour.astro`:

```astro
---
import { Icon } from 'astro-icon/components';

const highlights = [
	{
		icon: 'tabler:users',
		title: 'Client sessions',
		text: 'Inspect connected clients, their subscriptions, and session state in real time.',
	},
	{
		icon: 'tabler:share',
		title: 'Shared subscriptions',
		text: 'See how TBMQ load-balances a topic across a group of consuming applications.',
	},
	{
		icon: 'tabler:chart-line',
		title: 'Monitoring',
		text: 'Live throughput, connection, and latency metrics on the built-in dashboards.',
	},
];
---

<section id="ld-dashboard">
	<div class="inner">
		<p class="kicker">Explore the dashboard</p>
		<h2>See the full management UI</h2>
		<p class="lead">
			Create a free demo account to log in to the TBMQ web interface and explore how the broker
			is administered, monitored, and scaled — the same UI you get in production.
		</p>
		<div class="grid">
			{
				highlights.map((h) => (
					<div class="feature">
						<Icon name={h.icon} class="feature-icon" />
						<h3>{h.title}</h3>
						<p>{h.text}</p>
					</div>
				))
			}
		</div>
		<a class="btn btn-primary" href="https://demo.tbmq.io/signup" target="_blank" rel="noopener noreferrer">
			Create free demo account
			<Icon name="tabler:arrow-up-right" class="btn-icon" />
		</a>
		<p class="note">A free account is required to access the web dashboard.</p>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#ld-dashboard {
		background-color: $color-white;
		padding: $spacing-20 $spacing-6;
	}

	.inner {
		@include container;
		max-width: 1000px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.kicker {
		text-transform: uppercase;
		letter-spacing: 0.16em;
		font-size: 14px;
		font-weight: $font-weight-semibold;
		color: $color-pe-dark;
		margin: 0 0 16px;
	}

	h2 {
		@include section-title;
		margin: 0 0 20px;
		text-wrap: balance;
	}

	.lead {
		@include text-m;
		color: $color-text-secondary;
		max-width: 680px;
		margin: 0 0 56px;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 32px;
		width: 100%;
		margin-bottom: 56px;

		@include media-up(md) {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.feature {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;

		h3 {
			@include card-title;
			margin: 16px 0 8px;
		}

		p {
			@include text-s;
			color: $color-text-secondary;
			max-width: 30ch;
		}
	}

	:global(.feature-icon) {
		width: 32px;
		height: 32px;
		color: $color-pe-dark;
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

		&.btn-primary {
			background-color: $color-pe-dark;
			color: $color-white;

			&:hover {
				background-color: $color-pe-link;
			}
		}
	}

	.note {
		@include text-s;
		color: $color-text-muted;
		margin: 16px 0 0;
	}
</style>
```

> Note: verify these mixins/tokens exist before relying on them — `grep -nE "text-m|text-s|section-title|card-title|color-text-secondary|color-text-muted" src/styles/_variables.scss`. All were confirmed present during planning; if a name differs, substitute the closest existing one.

- [ ] **Step 2: Wire into the page**

In `src/pages/live-demo.astro`, add the import after the hero import:

```astro
import DashboardTour from '@components/LiveDemo/DashboardTour.astro';
```

and add `<DashboardTour />` after `<LiveDemoHero />` inside `<main>`.

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: PASS (0 errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/LiveDemo/DashboardTour.astro src/pages/live-demo.astro
git commit -m "feat(live-demo): add dashboard tour section"
```

---

## Task 3: Connect card (connection details + tabs + safety note + JS)

**Files:**
- Create: `src/components/LiveDemo/ConnectCard.astro`
- Modify: `src/pages/live-demo.astro` (add import + element)

**Interfaces:**
- Produces: `ConnectCard` (no props); section anchor `#ld-connect` (targeted by the hero's "Or connect a client ↓" link).
- Consumes: page composition from Tasks 1–2.

- [ ] **Step 1: Create the component**

Create `src/components/LiveDemo/ConnectCard.astro`:

```astro
---
const ports = [
	{ label: 'MQTT (TCP)', value: '1883' },
	{ label: 'MQTTS (TLS)', value: '8883' },
	{ label: 'WS (WebSocket)', value: '8084' },
	{ label: 'WSS (WebSocket TLS)', value: '443' },
];

const tabs = [
	{
		id: 'sub',
		label: 'Subscribe',
		code: 'mosquitto_sub -d -h demo.tbmq.io -p 1883 -q 1 \\\n  -t sensors/temperature -u demo',
	},
	{
		id: 'pub',
		label: 'Publish',
		code: 'mosquitto_pub -d -h demo.tbmq.io -p 1883 -q 1 \\\n  -t sensors/temperature -m 25 -u demo',
	},
	{
		id: 'tls',
		label: 'Subscribe over TLS',
		code: 'mosquitto_sub -d -h demo.tbmq.io -p 8883 -q 1 \\\n  -t sensors/temperature -u demo \\\n  --cafile tbmq-demo-root-ca.pem',
	},
];
---

<section id="ld-connect">
	<div class="inner">
		<p class="kicker">No signup required</p>
		<h2>Connect a client in seconds</h2>
		<p class="lead">
			Point any MQTT client at the public demo broker. Use the connection details below — the
			examples use <a href="https://mosquitto.org/download/" target="_blank" rel="noopener noreferrer">mosquitto</a>,
			a widely used open-source CLI client.
		</p>

		<div class="grid">
			<!-- Connection details card -->
			<div class="conn-card">
				<div class="conn-head">
					<span class="conn-host">demo.tbmq.io</span>
					<button class="copy" data-copy="demo.tbmq.io" aria-label="Copy host">Copy</button>
				</div>
				<div class="conn-rows">
					{
						ports.map((p) => (
							<div class="conn-row">
								<span class="conn-label">{p.label}</span>
								<span class="conn-value">{p.value}</span>
							</div>
						))
					}
					<div class="conn-row">
						<span class="conn-label">Username</span>
						<span class="conn-value">demo</span>
					</div>
					<div class="conn-row">
						<span class="conn-label">Password</span>
						<span class="conn-value muted">None required</span>
					</div>
					<div class="conn-row">
						<span class="conn-label">CA Certificate</span>
						<a class="conn-value link" href="/resources/tbmq-demo-root-ca.pem" download="tbmq-demo-root-ca.pem">
							tbmq-demo-root-ca.pem
						</a>
					</div>
				</div>
			</div>

			<!-- Tabbed CLI examples -->
			<div class="tabs" data-ld-tabs>
				<div class="tab-bar" role="tablist">
					{
						tabs.map((t, i) => (
							<button
								class:list={['tab', { active: i === 0 }]}
								role="tab"
								aria-selected={i === 0 ? 'true' : 'false'}
								data-tab={t.id}
							>
								{t.label}
							</button>
						))
					}
				</div>
				{
					tabs.map((t, i) => (
						<div class:list={['tab-panel', { active: i === 0 }]} data-panel={t.id}>
							<pre><code>{t.code}</code></pre>
							<button class="copy copy-code" data-copy={t.code} aria-label="Copy command">Copy</button>
						</div>
					))
				}
			</div>
		</div>

		<p class="safety">
			<strong>Heads up:</strong> the demo is a shared public environment. All messages and topics
			are visible to other users. Please do not transmit sensitive data.
		</p>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#ld-connect {
		background-color: $color-bg-light;
		padding: $spacing-20 $spacing-6;
	}

	.inner {
		@include container;
		max-width: 1100px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.kicker {
		text-transform: uppercase;
		letter-spacing: 0.16em;
		font-size: 14px;
		font-weight: $font-weight-semibold;
		color: $color-pe-dark;
		margin: 0 0 16px;
	}

	h2 {
		@include section-title;
		margin: 0 0 20px;
	}

	.lead {
		@include text-m;
		color: $color-text-secondary;
		max-width: 720px;
		margin: 0 0 48px;

		a {
			color: $color-pe-dark;
			text-decoration: underline;
		}
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		width: 100%;
		text-align: left;

		@include media-up(lg) {
			grid-template-columns: 1fr 1fr;
		}
	}

	.conn-card,
	.tabs {
		background: $color-white;
		border: 1px solid $color-border;
		border-radius: 14px;
		overflow: hidden;
	}

	.conn-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid $color-border;
	}

	.conn-host {
		font-family: $font-family-mono;
		font-weight: $font-weight-semibold;
	}

	.conn-rows {
		padding: 8px 20px 16px;
	}

	.conn-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 0;
		border-bottom: 1px solid $color-border-light;

		&:last-child {
			border-bottom: none;
		}
	}

	.conn-label {
		@include text-s;
		color: $color-text-muted;
	}

	.conn-value {
		font-family: $font-family-mono;
		font-size: 14px;
		color: $color-text-primary;

		&.muted {
			font-family: inherit;
			font-style: italic;
			color: $color-text-muted;
		}

		&.link {
			color: $color-pe-dark;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.tab-bar {
		display: flex;
		border-bottom: 1px solid $color-border;
	}

	.tab {
		flex: 1;
		padding: 12px 8px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: 14px;
		font-weight: $font-weight-medium;
		color: $color-text-muted;
		cursor: pointer;
		transition: 0.2s;

		&.active {
			color: $color-pe-dark;
			border-bottom-color: $color-pe-dark;
		}
	}

	.tab-panel {
		display: none;
		position: relative;

		&.active {
			display: block;
		}

		pre {
			margin: 0;
			padding: 20px;
			overflow-x: auto;
		}

		code {
			font-family: $font-family-mono;
			font-size: 13px;
			line-height: 1.6;
			white-space: pre;
			color: $color-text-primary;
		}
	}

	.copy {
		border: 1px solid $color-border;
		background: $color-white;
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 12px;
		color: $color-text-secondary;
		cursor: pointer;
		transition: 0.2s;

		&:hover {
			border-color: $color-pe-dark;
			color: $color-pe-dark;
		}

		&.copied {
			color: $color-pe-dark;
			border-color: $color-pe-dark;
		}
	}

	.copy-code {
		position: absolute;
		top: 12px;
		right: 12px;
	}

	.safety {
		@include text-s;
		color: $color-text-secondary;
		background: rgba(255, 196, 0, 0.1);
		border: 1px solid rgba(255, 196, 0, 0.35);
		border-radius: 10px;
		padding: 14px 18px;
		margin: 32px 0 0;
		max-width: 760px;
		text-align: left;
	}
</style>

<script>
	// Tab switcher
	document.querySelectorAll<HTMLElement>('[data-ld-tabs]').forEach((root) => {
		const tabs = root.querySelectorAll<HTMLButtonElement>('.tab');
		const panels = root.querySelectorAll<HTMLElement>('.tab-panel');
		tabs.forEach((tab) => {
			tab.addEventListener('click', () => {
				const id = tab.dataset.tab;
				tabs.forEach((t) => {
					const on = t === tab;
					t.classList.toggle('active', on);
					t.setAttribute('aria-selected', on ? 'true' : 'false');
				});
				panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === id));
			});
		});
	});

	// Copy-to-clipboard
	document.querySelectorAll<HTMLButtonElement>('.copy').forEach((btn) => {
		btn.addEventListener('click', () => {
			navigator.clipboard.writeText(btn.dataset.copy ?? '').then(() => {
				const original = btn.textContent;
				btn.textContent = 'Copied ✓';
				btn.classList.add('copied');
				setTimeout(() => {
					btn.textContent = original;
					btn.classList.remove('copied');
				}, 1500);
			});
		});
	});

	// Live status pinger — updates the hero pill created in LiveDemoHero
	const statusEl = document.querySelector<HTMLElement>('[data-ld-status]');
	if (statusEl) {
		fetch('https://demo.tbmq.io', { mode: 'no-cors' })
			.then(() => statusEl.classList.add('online'))
			.catch(() => statusEl.classList.add('offline'));
	}
</script>
```

> Note: the status pinger lives here (not in the hero) so all client JS is in one component; it targets the hero's `[data-ld-status]` element by selector. If `$color-bg-light`, `$color-border`, `$color-border-light`, `$color-text-primary`, or `$font-family-mono` don't exist, substitute the nearest token (`grep -nE "color-bg-light|color-border|color-text-primary|font-family-mono|font-mono" src/styles/_variables.scss`).

- [ ] **Step 2: Wire into the page**

In `src/pages/live-demo.astro`, add:

```astro
import ConnectCard from '@components/LiveDemo/ConnectCard.astro';
```

and add `<ConnectCard />` after `<DashboardTour />`.

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: PASS (0 errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/LiveDemo/ConnectCard.astro src/pages/live-demo.astro
git commit -m "feat(live-demo): add connect card with connection details and CLI tabs"
```

---

## Task 4: "Ready for production?" section

**Files:**
- Create: `src/components/LiveDemo/ProductionCta.astro`
- Modify: `src/pages/live-demo.astro` (add import + element)

**Interfaces:**
- Produces: `ProductionCta` (no props).
- Consumes: page composition from Tasks 1–3.

- [ ] **Step 1: Create the component**

Create `src/components/LiveDemo/ProductionCta.astro`:

```astro
---
import { Icon } from 'astro-icon/components';

const cards = [
	{
		icon: 'tabler:server',
		title: 'TBMQ Professional',
		text: 'Deploy on your own infrastructure with full enterprise controls — RBAC, OAuth 2.0, White Labeling, and advanced security at any scale.',
		cta: 'Start free trial',
		href: '/docs/mqtt-broker/pe/installation/',
	},
	{
		icon: 'tabler:cloud',
		title: 'TBMQ Private Cloud',
		text: 'Fully managed by the ThingsBoard team, from deployment to scaling. No infrastructure to run, no upgrades to plan — just connect.',
		cta: 'Learn more',
		href: '/pricing/?section=tbmq-options&product=tbmq-private-cloud',
	},
];
---

<section id="ld-production">
	<div class="inner">
		<h2>Ready for production?</h2>
		<p class="lead">When you've seen enough, take TBMQ to production your way.</p>
		<div class="grid">
			{
				cards.map((c) => (
					<div class="prod-card">
						<Icon name={c.icon} class="prod-icon" />
						<h3>{c.title}</h3>
						<p>{c.text}</p>
						<a class="btn" href={c.href}>
							{c.cta}
							<Icon name="tabler:arrow-right" class="btn-icon" />
						</a>
					</div>
				))
			}
		</div>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	#ld-production {
		background-color: $color-white;
		padding: $spacing-20 $spacing-6;
	}

	.inner {
		@include container;
		max-width: 1000px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	h2 {
		@include section-title;
		margin: 0 0 16px;
	}

	.lead {
		@include text-m;
		color: $color-text-secondary;
		margin: 0 0 48px;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		width: 100%;
		text-align: left;

		@include media-up(md) {
			grid-template-columns: 1fr 1fr;
		}
	}

	.prod-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 32px;
		border: 1px solid $color-border;
		border-radius: 14px;
		background: $color-white;

		h3 {
			@include card-title;
			margin: 16px 0 12px;
		}

		p {
			@include text-s;
			color: $color-text-secondary;
			margin: 0 0 24px;
			flex-grow: 1;
		}
	}

	:global(.prod-icon) {
		width: 32px;
		height: 32px;
		color: $color-pe-dark;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 24px;
		line-height: 42px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: $font-weight-medium;
		text-decoration: none;
		background-color: $color-pe-dark;
		color: $color-white;
		transition: 0.3s;

		&:hover {
			background-color: $color-pe-link;
		}
	}

	:global(.btn-icon) {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}
</style>
```

- [ ] **Step 2: Wire into the page**

In `src/pages/live-demo.astro`, add:

```astro
import ProductionCta from '@components/LiveDemo/ProductionCta.astro';
```

and add `<ProductionCta />` after `<ConnectCard />`.

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: PASS (0 errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/LiveDemo/ProductionCta.astro src/pages/live-demo.astro
git commit -m "feat(live-demo): add ready-for-production CTA section"
```

---

## Task 5: Header + OG wiring

**Files:**
- Modify: `src/components/Landing/HeaderContent.astro` (five `#performance` selector groups + `$no-dark-pages`)
- Modify: `src/util/ogContext.ts:84`

**Interfaces:**
- Consumes: `pageId="live-demo"` → `<html id="live-demo">` from Task 1.

- [ ] **Step 1: Add `#live-demo` to the header selector groups**

In `src/components/Landing/HeaderContent.astro`, add `#live-demo,` immediately after **each** occurrence of `#performance,` in these five places (search: `grep -n "#performance" src/components/Landing/HeaderContent.astro` — expect 4 selector-list hits plus 1 inside the `$no-dark-pages` string):

1. Always-solid-header box-shadow list (`#products, … #installations, #performance, #choose-region, …`) — add `#live-demo,`.
2. Non-transparent-header divider/button list — add `#live-demo,`.
3. Opened-burger (mobile) list — add `#live-demo,`.
4. Hide search/theme-toggle list — add `#live-demo,`.
5. The `$no-dark-pages` SCSS string variable — insert `#live-demo, ` into the comma-separated string (e.g. `… #installations, #performance, #live-demo, #choose-region, …`).

For each of groups 1–4, the edit turns:

```scss
	#installations,
	#performance,
	#choose-region,
```

into:

```scss
	#installations,
	#performance,
	#live-demo,
	#choose-region,
```

For group 5, turn:

```scss
	$no-dark-pages: '…, #installations, #performance, #choose-region, #google-iot-core-alternative';
```

into (insert `#live-demo, ` after `#performance, `):

```scss
	$no-dark-pages: '…, #installations, #performance, #live-demo, #choose-region, #google-iot-core-alternative';
```

- [ ] **Step 2: Add `/live-demo/` to the OG allowlist**

In `src/util/ogContext.ts`, add `'/live-demo/',` to `MARKETING_ALLOWLIST` (after `'/performance/',`):

```ts
export const MARKETING_ALLOWLIST: ReadonlyArray<string> = [
	'/',
	'/pricing/',
	'/products/*',
	'/community/*',
	'/contact-us/',
	'/installations/*',
	'/performance/',
	'/live-demo/',
	'/cookie-policy/',
	'/company/*',
];
```

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: PASS (0 errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/Landing/HeaderContent.astro src/util/ogContext.ts
git commit -m "feat(live-demo): wire header styling and OG card for /live-demo/"
```

---

## Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Type-check**

Run: `pnpm check`
Expected: PASS (0 errors, 0 warnings).

- [ ] **Step 2: Lint**

Run: `pnpm lint:eslint`
Expected: PASS.

- [ ] **Step 3: Build (ASK THE USER FIRST per repo policy)**

Ask: "Run `pnpm build:fast` to verify, or skip?" If approved:
Run: `pnpm build:fast`
Expected: build completes; `dist/live-demo/index.html` exists. Verify:
`test -f dist/live-demo/index.html && grep -c "demo.tbmq.io" dist/live-demo/index.html`
Expected: file exists; count ≥ 1.

- [ ] **Step 4: Link check**

Run: `pnpm lint:linkcheck:nobuild` (reuses the build from Step 3)
Expected: 0 broken links. Confirms the nav link `/live-demo/`, PE-install link, pricing link, and cert download resolve.

- [ ] **Step 5: Manual visual check (dev server)**

Run: `pnpm dev`, open `http://localhost:4321/live-demo/`. Confirm:
- Top-nav "Live Demo" navigates here in-tab.
- Hero: status pill resolves to Online/Offline; "Create free demo account" opens `demo.tbmq.io/signup` in a new tab; "Or connect a client ↓" scrolls to the connect section.
- Dashboard tour renders three highlights + CTA.
- Connect card: copy buttons work; the three tabs switch; CA cert downloads.
- "Ready for production?" cards link to PE install and pricing.
- Header is solid (not transparent) and renders light even if the browser/OS is in dark mode.

- [ ] **Step 6: Final commit (if any manual fixes were needed)**

```bash
git add -A
git commit -m "fix(live-demo): address verification findings"
```

---

## Self-Review

**Spec coverage:**
- Route/layout/pageId → Task 1. ✅
- Hero + status pill + signup CTA + secondary anchor → Task 1 (pill JS in Task 3). ✅
- Text-only dashboard tour + CTA → Task 2. ✅
- Connect card (host/ports/creds/cert) + Sub/Pub/TLS tabs + copy → Task 3. ✅
- Safety note → Task 3. ✅
- Ready-for-production cards (PE + Private Cloud) → Task 4. ✅
- Wiring: navigation.ts (Task 1), HeaderContent selectors + $no-dark-pages (Task 5), ogContext allowlist (Task 5), marketing-meta verified in Task 6 manual/OG check. ✅
- Non-goals (docs page untouched, no screenshots, no upstream files) → respected; no task touches them. ✅
- Verification (check/build/linkcheck/manual) → Task 6. ✅

**Placeholder scan:** No TBD/TODO. Every code step shows complete code. Token/mixin fallbacks are called out with the exact `grep` to confirm, not left vague.

**Type consistency:** `[data-ld-status]` is emitted by the hero (Task 1) and read by the pinger (Task 3) — names match. `#ld-connect` anchor emitted by ConnectCard (Task 3) and linked by the hero (Task 1) — match. `data-copy` / `data-tab` / `data-panel` attributes and their JS lookups match within Task 3. Component names (`LiveDemoHero`, `DashboardTour`, `ConnectCard`, `ProductionCta`) are consistent across page imports.

**Open verification points (not blockers):** all SCSS tokens used were confirmed present during planning — `$font-family-mono` (line 62), `$color-bg-light` (29), `$color-border` (35), `$color-border-light` (36), `$color-text-primary` (22), `$color-text-secondary` (23), `$color-text-muted` (24); the per-step `grep` notes are defensive only. The OG slab word for `/live-demo/` falls through to `'Solutions'`; confirm it reads acceptably during Task 6 and add a `marketing-meta.ts` override only if poor.
