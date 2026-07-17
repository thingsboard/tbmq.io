# MQTT Learn Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a marketing-framed MQTT learn hub at `/mqtt/` (hub + 11 topic pages, 3 fully written and 8 short-form) plus a new "Learn" dropdown in the top nav after Company.

**Architecture:** A single data registry (`src/data/mqttLearn.ts`) drives the hub grid, the Learn dropdown, related-topics, and per-page SEO. A reusable single-column layout component (`MqttTopicLayout.astro`) composes small presentational components (quick-answer, "How TBMQ handles this", FAQ, related, CTA). Each topic is a thin `.astro` page that fills the layout's body slot. Pages are marketing-styled with the site's SCSS design tokens (not Starlight docs chrome) and link *into* the docs for depth.

**Tech Stack:** Astro 6 + Starlight, TypeScript, SCSS (design tokens in `src/styles/_variables.scss`), `astro-icon` (tabler), existing `BaseLayout.astro` + `marketingJsonLd` helper.

---

## Verification model (read first)

This repo has **no unit-test runner**; CI is `astro check`, `eslint`, `slugcheck`, and (separate pipeline) `linkcheck` + build. Per "follow existing patterns", each task is verified with the repo's real gates instead of unit tests:

- **Type/compile:** `pnpm check`
- **Lint:** `pnpm lint:eslint`
- **Rendered output:** `curl` the dev server and `grep` for expected strings (dev server runs on `http://localhost:4321`; start with `pnpm dev` if not already running — one is currently running in the session).
- **Links:** `pnpm lint:linkcheck` (Task 11)
- **Build:** `pnpm build:fast` (Task 11 — ask the user before running, per repo build policy)
- **Visual:** headless-Chrome screenshots (Task 11)

**Branch:** create `feature/mqtt-learn-hub` off `develop` before Task 1: `git checkout develop && git checkout -b feature/mqtt-learn-hub`. Commit after every task.

**Design tokens used** (from `src/styles/_variables.scss`): `$color-pe #17bb52`, `$color-pe-dark #1f8b4d`, `$color-pe-link #166c37`, `$color-text-primary #17181c`, `$color-text-secondary #63656c`, `$color-text-muted #707275`, `$color-bg-white`, `$color-bg-light #f7f9fc`, `$color-border #ebebeb`; spacing `$spacing-*`; `$font-weight-*`; `$font-family-mono`; mixins `@include container`, `@include media-up(md)`, `@include section-title`, `@include text-m`.

---

## File structure

**New**
- `src/data/mqttLearn.ts` — topic registry + helpers (Task 1)
- `src/components/MqttLearn/QuickAnswer.astro` (Task 2)
- `src/components/MqttLearn/HowTbmqBlock.astro` (Task 2)
- `src/components/MqttLearn/LearnCta.astro` (Task 2)
- `src/components/MqttLearn/RelatedTopics.astro` (Task 2)
- `src/components/MqttLearn/FaqAccordion.astro` (Task 2)
- `src/components/MqttLearn/TopicGrid.astro` (Task 3)
- `src/components/MqttLearn/MqttTopicLayout.astro` (Task 3)
- `src/pages/mqtt/index.astro` — hub (Task 4)
- `src/pages/mqtt/what-is-mqtt.astro` (Task 6)
- `src/pages/mqtt/mqtt-vs-kafka.astro` (Task 7)
- `src/pages/mqtt/shared-subscriptions.astro` (Task 8)
- `src/pages/mqtt/{qos,mqtt-5,persistent-session,topics,retained-messages,last-will,security,websocket}.astro` (Task 9)

**Modified**
- `src/components/Landing/HeaderContent.astro` — add `#mqtt-learn` to marketing-header selector groups + OG (Task 5)
- `src/util/ogContext.ts` — add `/mqtt/*` to `MARKETING_ALLOWLIST` (Task 5)
- `src/data/navigation.ts` — Learn item + `learnSubmenu` (Task 10)

---

## Task 1: Content registry — `src/data/mqttLearn.ts`

**Files:**
- Create: `src/data/mqttLearn.ts`

- [ ] **Step 1: Create the registry with all 11 topics and helpers**

```ts
// Single source of truth for the /mqtt/ learn hub: drives the hub grid, the
// Learn nav dropdown, related-topics, and per-page SEO.

export interface MqttTopic {
	/** URL slug → /mqtt/<slug>/ */
	slug: string;
	/** H1 + <title> (before the ' | TBMQ' suffix BaseLayout adds) */
	title: string;
	/** Short label for the nav dropdown + hub card */
	navLabel: string;
	/** Hero eyebrow */
	eyebrow: string;
	/** 2–3 sentence boxed definition (featured-snippet target) */
	quickAnswer: string;
	/** One-line "how TBMQ relates" summary (hub card + How-TBMQ block) */
	tbmqTieIn: string;
	/** Slugs shown in the related-topics grid */
	related: string[];
	/** Show in the Learn nav dropdown */
	marquee: boolean;
	/** 'full' = flagship article, 'short' = short-form scaffold */
	status: 'full' | 'short';
	/** Meta description */
	seoDescription: string;
}

export const mqttTopics: MqttTopic[] = [
	{
		slug: 'what-is-mqtt',
		title: "What Is MQTT? A Beginner's Guide to the Protocol",
		navLabel: 'What is MQTT?',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT (Message Queuing Telemetry Transport) is a lightweight publish/subscribe messaging protocol built for constrained devices and low-bandwidth, unreliable networks. Clients publish messages to named topics on a central broker, which forwards each message to every client subscribed to that topic — decoupling senders from receivers.',
		tbmqTieIn:
			'TBMQ is an open-source MQTT broker (3.1, 3.1.1 and 5.0) engineered to scale to 100M+ concurrent connections.',
		related: ['qos', 'topics', 'mqtt-5', 'mqtt-vs-kafka'],
		marquee: true,
		status: 'full',
		seoDescription:
			"What is MQTT? A plain-English guide to the lightweight publish/subscribe protocol behind modern IoT — how it works, why it's used, and how it compares to HTTP.",
	},
	{
		slug: 'mqtt-vs-kafka',
		title: 'MQTT vs Kafka: Key Differences and When to Use Each',
		navLabel: 'MQTT vs Kafka',
		eyebrow: 'MQTT COMPARISON',
		quickAnswer:
			'MQTT is a lightweight pub/sub protocol for connecting devices over unreliable networks; Apache Kafka is a distributed event-streaming log for high-throughput backend data pipelines. They solve different problems and are frequently used together — MQTT at the edge, Kafka in the data center.',
		tbmqTieIn:
			'TBMQ uses Kafka as its internal backbone for durability and zero message loss, and can bridge MQTT traffic straight into your Kafka topics.',
		related: ['what-is-mqtt', 'qos', 'persistent-session'],
		marquee: true,
		status: 'full',
		seoDescription:
			'MQTT vs Kafka compared: pub/sub protocol vs event-streaming log, delivery guarantees, scale, and when to use each — or both together.',
	},
	{
		slug: 'shared-subscriptions',
		title: 'MQTT Shared Subscriptions Explained',
		navLabel: 'Shared subscriptions',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A shared subscription lets a group of MQTT clients share one subscription so each message is delivered to only one member of the group, instead of to all of them. That turns MQTT’s broadcast model into a load-balanced work queue for scaling consumers horizontally.',
		tbmqTieIn:
			'TBMQ implements shared subscriptions and pairs them with dedicated per-application Kafka topics, so you can add consumer instances to absorb load without losing ordering.',
		related: ['what-is-mqtt', 'mqtt-5', 'mqtt-vs-kafka'],
		marquee: true,
		status: 'full',
		seoDescription:
			'How MQTT shared subscriptions work: the $share syntax, load balancing across a consumer group, MQTT 5.0 vs 3.1.1, and common pitfalls.',
	},
	{
		slug: 'qos',
		title: 'MQTT QoS 0, 1 and 2 Explained',
		navLabel: 'QoS levels',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT Quality of Service (QoS) sets the delivery guarantee for each message: QoS 0 delivers at most once (fire-and-forget), QoS 1 at least once (may duplicate), and QoS 2 exactly once (handshaked). Higher QoS means stronger guarantees and more overhead.',
		tbmqTieIn:
			'TBMQ acknowledges a QoS 1/2 publish only after the message is durably stored in Kafka — so an accepted message is never lost, even if a node fails.',
		related: ['what-is-mqtt', 'persistent-session', 'mqtt-5'],
		marquee: true,
		status: 'short',
		seoDescription:
			'MQTT QoS levels 0, 1 and 2 explained simply — at-most-once, at-least-once and exactly-once delivery, with trade-offs and when to use each.',
	},
	{
		slug: 'mqtt-5',
		title: "MQTT 5.0: What's New vs MQTT 3.1.1",
		navLabel: 'MQTT 5.0',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT 5.0 is the latest version of the protocol. It keeps the lightweight pub/sub core of 3.1.1 and adds reason codes, user properties, topic aliases, shared subscriptions, message and session expiry, and flow control — giving you far better error reporting and control.',
		tbmqTieIn:
			'TBMQ fully supports MQTT 5.0 alongside 3.1 and 3.1.1, including reason codes, topic aliases, session/message expiry and flow control.',
		related: ['what-is-mqtt', 'shared-subscriptions', 'topics'],
		marquee: true,
		status: 'short',
		seoDescription:
			'MQTT 5.0 vs 3.1.1: the key new features — reason codes, user properties, topic aliases, expiry, shared subscriptions and flow control.',
	},
	{
		slug: 'persistent-session',
		title: 'MQTT Persistent Sessions and Clean Start',
		navLabel: 'Persistent sessions',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A persistent MQTT session lets the broker remember a client’s subscriptions and queue its messages while it is offline, so nothing is missed across reconnects. The Clean Start flag (MQTT 5.0) and Clean Session flag (3.1.1) control whether a fresh session is created or an existing one resumed.',
		tbmqTieIn:
			'TBMQ persists sessions differently per client type — DEVICE clients use Redis-backed queues, APPLICATION clients get a dedicated Kafka topic — so offline delivery scales to millions of devices.',
		related: ['qos', 'what-is-mqtt', 'shared-subscriptions'],
		marquee: true,
		status: 'short',
		seoDescription:
			'MQTT persistent sessions and clean start / clean session explained — how brokers queue messages for offline clients and resume state on reconnect.',
	},
	{
		slug: 'topics',
		title: 'MQTT Topics and Wildcards',
		navLabel: 'Topics & wildcards',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT topics are hierarchical, slash-separated strings (e.g. sensors/floor1/temp) that messages are published to and clients subscribe to. Subscriptions can use wildcards: + matches a single level and # matches all remaining levels.',
		tbmqTieIn:
			'TBMQ matches topics with an in-memory subscription trie, so lookup cost depends on topic depth — not on how many subscriptions exist. A million subscriptions match as fast as a thousand.',
		related: ['what-is-mqtt', 'shared-subscriptions', 'retained-messages'],
		marquee: false,
		status: 'short',
		seoDescription:
			'MQTT topics and wildcards explained — topic hierarchy, single-level (+) and multi-level (#) wildcards, and topic naming best practices.',
	},
	{
		slug: 'retained-messages',
		title: 'MQTT Retained Messages',
		navLabel: 'Retained messages',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'A retained message is the last message the broker stored for a topic with the retain flag set. Any client that subscribes later immediately receives that last known value instead of waiting for the next publish — ideal for state like a device’s current status.',
		tbmqTieIn:
			'TBMQ keeps retained messages in a dedicated store, so new subscribers get the latest value instantly even at high topic counts.',
		related: ['topics', 'what-is-mqtt', 'last-will'],
		marquee: false,
		status: 'short',
		seoDescription:
			'MQTT retained messages explained — how the retain flag stores the last value on a topic so new subscribers get current state immediately.',
	},
	{
		slug: 'last-will',
		title: 'MQTT Last Will and Testament (LWT)',
		navLabel: 'Last Will & Testament',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'The Last Will and Testament (LWT) is a message a client registers when it connects; if the client disconnects unexpectedly, the broker publishes that message on its behalf. It’s how MQTT signals that a device dropped off ungracefully.',
		tbmqTieIn:
			'TBMQ supports Last Will messages, so your applications can react the moment a device disconnects unexpectedly.',
		related: ['what-is-mqtt', 'retained-messages', 'persistent-session'],
		marquee: false,
		status: 'short',
		seoDescription:
			'MQTT Last Will and Testament (LWT) explained — how the broker publishes a client’s will message on unexpected disconnect to signal presence.',
	},
	{
		slug: 'security',
		title: 'MQTT Security: TLS and Authentication',
		navLabel: 'Security',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT security has three layers: transport encryption with TLS (port 8883), client authentication (username/password, client certificates, or tokens), and authorization that controls which topics a client may publish to or subscribe from.',
		tbmqTieIn:
			'TBMQ supports TLS, mutual TLS (X.509), basic username/password, JWT and SCRAM authentication, with per-client topic authorization.',
		related: ['what-is-mqtt', 'websocket', 'persistent-session'],
		marquee: false,
		status: 'short',
		seoDescription:
			'MQTT security explained — TLS encryption, authentication (passwords, client certificates, tokens) and topic authorization for a hardened broker.',
	},
	{
		slug: 'websocket',
		title: 'MQTT over WebSocket',
		navLabel: 'MQTT over WebSocket',
		eyebrow: 'MQTT GUIDE',
		quickAnswer:
			'MQTT over WebSocket carries the same MQTT protocol inside a WebSocket connection, so browsers and other HTTP-only clients can publish and subscribe directly. Brokers typically expose it on ports 8084/8085 (WSS).',
		tbmqTieIn:
			'TBMQ ships a built-in WebSocket MQTT client in its UI, so you can publish and subscribe straight from the browser — try it in the live demo.',
		related: ['what-is-mqtt', 'security', 'topics'],
		marquee: false,
		status: 'short',
		seoDescription:
			'MQTT over WebSocket explained — how the MQTT protocol runs inside a WebSocket so browser clients can publish and subscribe in real time.',
	},
];

const bySlug = new Map(mqttTopics.map((t) => [t.slug, t]));

export function getTopic(slug: string): MqttTopic {
	const topic = bySlug.get(slug);
	if (!topic) throw new Error(`Unknown MQTT topic slug: ${slug}`);
	return topic;
}

export function topicHref(slug: string): string {
	return `/mqtt/${slug}/`;
}

export function relatedTopics(slug: string): MqttTopic[] {
	return getTopic(slug).related.map((s) => getTopic(s));
}

export const marqueeTopics: MqttTopic[] = mqttTopics.filter((t) => t.marquee);
```

- [ ] **Step 2: Type-check**

Run: `pnpm check`
Expected: `0 errors` (the new file compiles; unused-export warnings are fine — they're consumed in later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/data/mqttLearn.ts
git commit -m "feat(mqtt-learn): add topic content registry"
```

---

## Task 2: Presentational leaf components

**Files:**
- Create: `src/components/MqttLearn/QuickAnswer.astro`
- Create: `src/components/MqttLearn/HowTbmqBlock.astro`
- Create: `src/components/MqttLearn/LearnCta.astro`
- Create: `src/components/MqttLearn/RelatedTopics.astro`
- Create: `src/components/MqttLearn/FaqAccordion.astro`

- [ ] **Step 1: `QuickAnswer.astro`**

```astro
---
interface Props {
	text: string;
}
const { text } = Astro.props;
---

<div class="quick-answer">
	<span class="quick-answer__label">Quick answer</span>
	<p class="quick-answer__text">{text}</p>
</div>

<style lang="scss">
	@use '../../styles/variables' as *;

	.quick-answer {
		border-left: 4px solid $color-pe-dark;
		background: #eaf7ef;
		border-radius: 0 6px 6px 0;
		padding: 20px 24px;
		margin: 0 0 $spacing-8;
	}
	.quick-answer__label {
		display: block;
		font-size: 12px;
		font-weight: $font-weight-semibold;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: $color-pe-link;
		margin-bottom: 8px;
	}
	.quick-answer__text {
		font-size: 18px;
		line-height: 1.6;
		color: $color-text-primary;
		margin: 0;
	}
</style>
```

- [ ] **Step 2: `HowTbmqBlock.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
interface Props {
	/** One-line tie-in (usually topic.tbmqTieIn). */
	text: string;
	/** Optional extra sentence of context. */
	detail?: string;
}
const { text, detail } = Astro.props;
---

<aside class="how-tbmq">
	<div class="how-tbmq__head">
		<Icon name="tabler:bolt" class="how-tbmq__icon" />
		<h2 class="how-tbmq__title">How TBMQ handles this</h2>
	</div>
	<p class="how-tbmq__text">{text}</p>
	{detail && <p class="how-tbmq__text">{detail}</p>}
	<div class="how-tbmq__links">
		<a href="/product/">Explore the architecture</a>
		<a href="/docs/mqtt-broker/">Read the docs</a>
	</div>
</aside>

<style lang="scss">
	@use '../../styles/variables' as *;

	.how-tbmq {
		background: #eaf7ef;
		border: 1px solid rgba(31, 139, 77, 0.28);
		border-radius: 8px;
		padding: 24px 28px;
		margin: $spacing-10 0;
	}
	.how-tbmq__head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}
	.how-tbmq__title {
		font-size: 20px;
		font-weight: $font-weight-semibold;
		color: $color-pe-link;
		margin: 0;
	}
	.how-tbmq__text {
		font-size: 16px;
		line-height: 1.7;
		color: $color-text-secondary;
		margin: 0 0 8px;
	}
	.how-tbmq__links {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-top: 12px;
		a {
			font-weight: $font-weight-medium;
			color: $color-pe-link;
			text-decoration: none;
			&:hover {
				text-decoration: underline;
			}
		}
	}
	:global(.how-tbmq__icon) {
		width: 22px;
		height: 22px;
		color: $color-pe-dark;
		flex-shrink: 0;
	}
</style>
```

- [ ] **Step 3: `LearnCta.astro`**

```astro
---
// Bottom conversion band, reused on every learn page.
---

<section class="learn-cta">
	<h2 class="learn-cta__title">Run it yourself</h2>
	<p class="learn-cta__text">
		TBMQ is a free, open-source MQTT broker built to scale. Spin it up in minutes or try the
		live demo — no install required.
	</p>
	<div class="learn-cta__actions">
		<a class="learn-cta__btn learn-cta__btn--primary" href="/installations/">Try it now</a>
		<a class="learn-cta__btn" href="/live-demo/">Live demo</a>
	</div>
</section>

<style lang="scss">
	@use '../../styles/variables' as *;

	.learn-cta {
		text-align: center;
		background: $color-text-primary;
		border-radius: 12px;
		padding: $spacing-12 $spacing-6;
		margin-top: $spacing-16;
	}
	.learn-cta__title {
		font-size: 28px;
		font-weight: $font-weight-semibold;
		color: #fff;
		margin: 0 0 12px;
	}
	.learn-cta__text {
		font-size: 16px;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.8);
		max-width: 560px;
		margin: 0 auto 24px;
	}
	.learn-cta__actions {
		display: flex;
		justify-content: center;
		gap: 16px;
		flex-wrap: wrap;
	}
	.learn-cta__btn {
		display: inline-flex;
		align-items: center;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: $font-weight-medium;
		text-decoration: none;
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: #fff;
		&:hover {
			border-color: #fff;
		}
	}
	.learn-cta__btn--primary {
		background: $color-pe;
		border-color: $color-pe;
		color: #fff;
		&:hover {
			background: $color-pe-hover;
			border-color: $color-pe-hover;
		}
	}
</style>
```

- [ ] **Step 4: `RelatedTopics.astro`**

```astro
---
import { relatedTopics, topicHref } from '~/data/mqttLearn';
interface Props {
	slug: string;
}
const { slug } = Astro.props;
const items = relatedTopics(slug);
---

{
	items.length > 0 && (
		<section class="related">
			<h2 class="related__title">Related topics</h2>
			<div class="related__grid">
				{items.map((t) => (
					<a class="related__card" href={topicHref(t.slug)}>
						<span class="related__label">{t.navLabel}</span>
						<span class="related__arrow">→</span>
					</a>
				))}
			</div>
		</section>
	)
}

<style lang="scss">
	@use '../../styles/variables' as *;

	.related {
		margin-top: $spacing-12;
	}
	.related__title {
		font-size: 20px;
		font-weight: $font-weight-semibold;
		color: $color-text-primary;
		margin: 0 0 $spacing-5;
	}
	.related__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
		@include media-up(md) {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.related__card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 16px 18px;
		border: 1px solid $color-border;
		border-radius: 8px;
		text-decoration: none;
		background: $color-bg-white;
		transition: border-color 0.15s ease;
		&:hover {
			border-color: $color-pe-dark;
		}
	}
	.related__label {
		font-weight: $font-weight-medium;
		color: $color-text-primary;
	}
	.related__arrow {
		color: $color-pe-dark;
	}
</style>
```

- [ ] **Step 5: `FaqAccordion.astro`** (renders `<details>` + emits FAQPage JSON-LD)

```astro
---
export interface FaqItem {
	q: string;
	a: string;
}
interface Props {
	items: FaqItem[];
}
const { items } = Astro.props;

const faqJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: items.map((it) => ({
		'@type': 'Question',
		name: it.q,
		acceptedAnswer: { '@type': 'Answer', text: it.a },
	})),
};
---

{
	items.length > 0 && (
		<section class="faq">
			<h2 class="faq__title">Frequently asked questions</h2>
			{items.map((it) => (
				<details class="faq__item">
					<summary class="faq__q">{it.q}</summary>
					<p class="faq__a">{it.a}</p>
				</details>
			))}
			<script
				type="application/ld+json"
				set:html={JSON.stringify(faqJsonLd)}
			/>
		</section>
	)
}

<style lang="scss">
	@use '../../styles/variables' as *;

	.faq {
		margin-top: $spacing-12;
	}
	.faq__title {
		font-size: 24px;
		font-weight: $font-weight-semibold;
		color: $color-text-primary;
		margin: 0 0 $spacing-5;
	}
	.faq__item {
		border-bottom: 1px solid $color-border;
		padding: 16px 0;
	}
	.faq__q {
		font-size: 17px;
		font-weight: $font-weight-medium;
		color: $color-text-primary;
		cursor: pointer;
		list-style: none;
		&::-webkit-details-marker {
			display: none;
		}
		&::before {
			content: '+';
			display: inline-block;
			width: 20px;
			color: $color-pe-dark;
			font-weight: $font-weight-bold;
		}
	}
	details[open] .faq__q::before {
		content: '\2212'; // minus sign
	}
	.faq__a {
		font-size: 16px;
		line-height: 1.7;
		color: $color-text-secondary;
		margin: 12px 0 0 20px;
	}
</style>
```

- [ ] **Step 6: Type-check + lint**

Run: `pnpm check && pnpm lint:eslint`
Expected: `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add src/components/MqttLearn/
git commit -m "feat(mqtt-learn): add quick-answer, how-tbmq, cta, related, faq components"
```

---

## Task 3: Layout + hub grid — `MqttTopicLayout.astro`, `TopicGrid.astro`

**Files:**
- Create: `src/components/MqttLearn/TopicGrid.astro`
- Create: `src/components/MqttLearn/MqttTopicLayout.astro`

- [ ] **Step 1: `TopicGrid.astro`** (hub card grid over all topics)

```astro
---
import { mqttTopics, topicHref } from '~/data/mqttLearn';
---

<div class="topic-grid">
	{
		mqttTopics.map((t) => (
			<a class="topic-card" href={topicHref(t.slug)}>
				<h3 class="topic-card__title">{t.navLabel}</h3>
				<p class="topic-card__text">{t.quickAnswer}</p>
				<span class="topic-card__cta">Read the guide →</span>
			</a>
		))
	}
</div>

<style lang="scss">
	@use '../../styles/variables' as *;

	.topic-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
		width: 100%;
		@include media-up(sm) {
			grid-template-columns: repeat(2, 1fr);
		}
		@include media-up(lg) {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.topic-card {
		display: flex;
		flex-direction: column;
		padding: 24px;
		border: 1px solid $color-border;
		border-radius: 10px;
		background: $color-bg-white;
		text-decoration: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		&:hover {
			border-color: $color-pe-dark;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
		}
	}
	.topic-card__title {
		font-size: 18px;
		font-weight: $font-weight-semibold;
		color: $color-text-primary;
		margin: 0 0 10px;
	}
	.topic-card__text {
		font-size: 14px;
		line-height: 1.6;
		color: $color-text-secondary;
		margin: 0 0 16px;
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.topic-card__cta {
		margin-top: auto;
		font-size: 14px;
		font-weight: $font-weight-medium;
		color: $color-pe-link;
	}
</style>
```

> **Note on breakpoints:** if `media-up(sm)` or `media-up(lg)` are not defined in `_variables.scss`, use only `media-up(md)` for a 1→2-column step (check the `@mixin media-up` breakpoint keys first with `grep -n "media-up\|breakpoints" src/styles/_variables.scss`). Do not invent breakpoint names.

- [ ] **Step 2: `MqttTopicLayout.astro`** (the reusable template)

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import { Products } from '@models/site.models';
import { marketingJsonLd } from '~/util/structuredData';
import { getTopic, topicHref } from '~/data/mqttLearn';
import QuickAnswer from './QuickAnswer.astro';
import HowTbmqBlock from './HowTbmqBlock.astro';
import RelatedTopics from './RelatedTopics.astro';
import LearnCta from './LearnCta.astro';
import FaqAccordion, { type FaqItem } from './FaqAccordion.astro';

interface Props {
	slug: string;
	faq?: FaqItem[];
}
const { slug, faq = [] } = Astro.props;
const topic = getTopic(slug);

const title = topic.title;
const description = topic.seoDescription;
const jsonLd = marketingJsonLd({
	path: topicHref(slug),
	name: title,
	description,
	breadcrumb: topic.navLabel,
});
---

<BaseLayout
	forceLightTheme
	title={title}
	description={description}
	pageId="mqtt-learn"
	gitHubPlatform={Products.TBMQ}
	jsonLd={jsonLd}
	ogImageAlt={title}
>
	<main class="learn-page">
		<div class="learn-page__inner">
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

			<div class="learn-body">
				<slot />
			</div>

			<HowTbmqBlock text={topic.tbmqTieIn} />
			<FaqAccordion items={faq} />
			<RelatedTopics slug={slug} />
			<LearnCta />
		</div>
	</main>
</BaseLayout>

<style lang="scss">
	@use '../../styles/variables' as *;

	.learn-page {
		padding: $spacing-12 $spacing-6 $spacing-20;
		background: var(--color-bg-surface);
	}
	.learn-page__inner {
		max-width: 760px;
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
		@include media-up(md) {
			font-size: 46px;
		}
	}

	// Shared prose styling for the <slot /> body of every learn page.
	.learn-body {
		:global(h2) {
			font-size: 28px;
			font-weight: $font-weight-semibold;
			color: $color-text-primary;
			margin: $spacing-10 0 $spacing-4;
		}
		:global(h3) {
			font-size: 20px;
			font-weight: $font-weight-semibold;
			color: $color-text-primary;
			margin: $spacing-6 0 $spacing-3;
		}
		:global(p) {
			font-size: 17px;
			line-height: 1.75;
			color: $color-text-secondary;
			margin: 0 0 $spacing-4;
		}
		:global(ul),
		:global(ol) {
			font-size: 17px;
			line-height: 1.75;
			color: $color-text-secondary;
			margin: 0 0 $spacing-4;
			padding-left: 24px;
		}
		:global(li) {
			margin-bottom: 8px;
		}
		:global(a) {
			color: $color-pe-link;
			text-decoration: underline;
		}
		:global(code) {
			font-family: $font-family-mono;
			font-size: 0.9em;
			background: $color-bg-light;
			padding: 2px 6px;
			border-radius: 3px;
			color: $color-text-primary;
		}
		:global(table) {
			width: 100%;
			border-collapse: collapse;
			margin: 0 0 $spacing-6;
			font-size: 15px;
		}
		:global(th),
		:global(td) {
			border: 1px solid $color-border;
			padding: 10px 14px;
			text-align: left;
			vertical-align: top;
			color: $color-text-secondary;
		}
		:global(th) {
			background: $color-bg-light;
			color: $color-text-primary;
			font-weight: $font-weight-semibold;
		}
		:global(.overflow-x) {
			overflow-x: auto;
		}
	}
</style>
```

- [ ] **Step 3: Type-check + lint**

Run: `pnpm check && pnpm lint:eslint`
Expected: `0 errors`.

- [ ] **Step 4: Commit**

```bash
git add src/components/MqttLearn/TopicGrid.astro src/components/MqttLearn/MqttTopicLayout.astro
git commit -m "feat(mqtt-learn): add reusable topic layout and hub grid"
```

---

## Task 4: Hub page — `src/pages/mqtt/index.astro`

**Files:**
- Create: `src/pages/mqtt/index.astro`

- [ ] **Step 1: Create the hub**

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import SectionHeader from '@components/Landing/SectionHeader.astro';
import TopicGrid from '@components/MqttLearn/TopicGrid.astro';
import LearnCta from '@components/MqttLearn/LearnCta.astro';
import { Products } from '@models/site.models';
import { marketingJsonLd } from '~/util/structuredData';

const title = 'MQTT Guide — Learn the Protocol Behind Modern IoT';
const description =
	'Clear, practical guides to MQTT: what it is, QoS levels, MQTT 5.0, shared subscriptions, MQTT vs Kafka, and more — from the team behind the open-source TBMQ broker.';
const jsonLd = marketingJsonLd({
	path: '/mqtt/',
	name: title,
	description,
	breadcrumb: 'Learn',
});
---

<BaseLayout
	forceLightTheme
	title={title}
	description={description}
	pageId="mqtt-learn"
	gitHubPlatform={Products.TBMQ}
	jsonLd={jsonLd}
	ogImageAlt="MQTT Guide by TBMQ"
>
	<main class="mqtt-hub">
		<div class="mqtt-hub__inner">
			<SectionHeader
				title="The MQTT Guide"
				subtitle="Practical, plain-English explanations of the MQTT protocol — written by the team behind TBMQ, the open-source MQTT broker built to scale."
			/>
			<TopicGrid />
			<LearnCta />
		</div>
	</main>
</BaseLayout>

<style lang="scss">
	@use '../../styles/variables' as *;

	.mqtt-hub {
		padding: $spacing-20 $spacing-6;
		background: var(--color-bg-surface);
	}
	.mqtt-hub__inner {
		@include container;
		max-width: 1100px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
```

- [ ] **Step 2: Verify it renders**

Run: `curl -s http://localhost:4321/mqtt/ | grep -o "The MQTT Guide\|topic-card\|Read the guide"`
Expected: matches for `The MQTT Guide` and multiple `topic-card` / `Read the guide` occurrences.

- [ ] **Step 3: Commit**

```bash
git add src/pages/mqtt/index.astro
git commit -m "feat(mqtt-learn): add hub page at /mqtt/"
```

---

## Task 5: Marketing-header integration + OG allowlist

`/mqtt/` pages use `pageId="mqtt-learn"` (i.e. `<html id="mqtt-learn">`). The header styles key off the page id; add `#mqtt-learn` alongside the other solid marketing pages, and register the section for OG cards.

**Files:**
- Modify: `src/components/Landing/HeaderContent.astro`
- Modify: `src/util/ogContext.ts`

- [ ] **Step 1: Add `#mqtt-learn` to the box-shadow group**

In `src/components/Landing/HeaderContent.astro`, find the selector list that ends with `#google-iot-core-alternative {` immediately followed by `header.header { box-shadow: 0 0 20px ...`. Add `#mqtt-learn,` on the line before `#google-iot-core-alternative,`. (There are TWO such enumerated groups that end in `#google-iot-core-alternative` — the box-shadow one near the top and the divider/button one; add `#mqtt-learn,` to BOTH.)

Example (box-shadow group):
```scss
	#installations,
	#performance,
	#live-demo,
	#product,
	#choose-region,
	#mqtt-learn,
	#google-iot-core-alternative {
		header.header {
			box-shadow: 0 0 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(0, 0, 0, 0.1);
		}
	}
```

- [ ] **Step 2: Add `#mqtt-learn` to the "hide search + theme toggle" group and the opened-burger group and the `$no-dark-pages` list**

In the same file, add `#mqtt-learn,` to:
- the large selector list controlling `search-button, theme-toggle { display: none; }` (ends `#google-iot-core-alternative {`),
- the `header.header.opened-burger` background group (ends `#google-iot-core-alternative {`),
- the `$no-dark-pages` SCSS string (append `, #mqtt-learn` inside the quotes).

The `$no-dark-pages` edit:
```scss
	$no-dark-pages: '#home, #thingsboard-paas, #thingsboard-pe, #products, #development-services, #trainings, #trendz, #partners, #thingsboard-edge, #mqtt-broker, #mobile-app, #mobile-pe, #products-form, #company, #mediakit, #careers, #installations, #performance, #live-demo, #product, #choose-region, #google-iot-core-alternative, #mqtt-learn';
```

- [ ] **Step 3: Add `/mqtt/*` to the OG allowlist**

In `src/util/ogContext.ts`, add `'/mqtt/*',` to the `MARKETING_ALLOWLIST` array (e.g. after `'/product/',`):
```ts
	'/product/',
	'/mqtt/*',
	'/live-demo/',
```

- [ ] **Step 4: Verify**

Run: `pnpm check && curl -s http://localhost:4321/mqtt/ | grep -o 'id="mqtt-learn"'`
Expected: `0 errors` and one `id="mqtt-learn"` match.

- [ ] **Step 5: Commit**

```bash
git add src/components/Landing/HeaderContent.astro src/util/ogContext.ts
git commit -m "feat(mqtt-learn): wire /mqtt/ into marketing header styles and OG cards"
```

---

## Task 6: Flagship — `what-is-mqtt.astro`

**Files:**
- Create: `src/pages/mqtt/what-is-mqtt.astro`

- [ ] **Step 1: Create the page**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
import type { FaqItem } from '@components/MqttLearn/FaqAccordion.astro';

const faq: FaqItem[] = [
	{ q: 'What does MQTT stand for?', a: 'MQTT originally stood for Message Queuing Telemetry Transport. Today it is simply the protocol name — it is not tied to any specific message-queue product.' },
	{ q: 'Is MQTT open source?', a: 'MQTT is an open OASIS and ISO standard, not a product, so anyone can implement it. There are many open-source brokers and clients, including the open-source TBMQ broker.' },
	{ q: 'What port does MQTT use?', a: 'MQTT uses TCP port 1883 by default, and 8883 for MQTT over TLS. Over WebSocket it commonly uses 8083/8084 (WS) and 8084/8085 (WSS).' },
	{ q: 'Is MQTT secure?', a: 'MQTT itself is a messaging protocol; security is added with TLS for encryption plus authentication and topic authorization at the broker. See our MQTT security guide.' },
	{ q: 'What is an MQTT broker?', a: 'The broker is the central server that receives every published message and routes it to the clients subscribed to the matching topic. TBMQ is one example of an MQTT broker.' },
];
---

<MqttTopicLayout slug="what-is-mqtt" faq={faq}>
	<h2>How MQTT works</h2>
	<p>
		MQTT follows a <strong>publish/subscribe</strong> model instead of the request/response
		model of HTTP. Clients never talk to each other directly. Instead, a publisher sends a
		message to a <a href="/mqtt/topics/">topic</a> on a central <strong>broker</strong>, and the
		broker forwards that message to every client that has subscribed to the topic. Publishers and
		subscribers are fully decoupled — they don't need to know about each other, run at the same
		time, or even know how many receivers exist.
	</p>
	<p>
		A typical setup has three roles: <strong>publishers</strong> (for example, sensors sending
		readings), <strong>subscribers</strong> (for example, a dashboard or backend service), and the
		<strong>broker</strong> that connects them. A single client can both publish and subscribe.
	</p>

	<h2>Why MQTT is used for IoT</h2>
	<p>
		MQTT was designed for constrained devices and unreliable networks, which is exactly the
		environment most IoT fleets live in. Its advantages:
	</p>
	<ul>
		<li><strong>Lightweight:</strong> a tiny 2-byte fixed header keeps overhead and battery use low.</li>
		<li><strong>Resilient:</strong> persistent connections, <a href="/mqtt/qos/">Quality of Service</a> levels, and <a href="/mqtt/last-will/">Last Will</a> messages handle flaky links gracefully.</li>
		<li><strong>Scalable:</strong> the decoupled pub/sub model lets one broker fan a message out to many subscribers efficiently.</li>
		<li><strong>Stateful when needed:</strong> <a href="/mqtt/persistent-session/">persistent sessions</a> and <a href="/mqtt/retained-messages/">retained messages</a> keep clients in sync across reconnects.</li>
	</ul>

	<h2>MQTT vs HTTP</h2>
	<p>
		HTTP is request/response: a client asks, the server answers, and the connection is typically
		short-lived. That's a poor fit for pushing frequent, small updates to many devices. MQTT keeps
		a long-lived connection open and pushes messages the instant they're published, with far less
		per-message overhead. For moving that device data into backend analytics pipelines, MQTT is
		often paired with a streaming platform — see <a href="/mqtt/mqtt-vs-kafka/">MQTT vs Kafka</a>.
	</p>

	<h2>Core MQTT concepts</h2>
	<p>Once the pub/sub basics click, these are the concepts worth knowing next:</p>
	<ul>
		<li><a href="/mqtt/topics/">Topics &amp; wildcards</a> — how messages are addressed and matched.</li>
		<li><a href="/mqtt/qos/">Quality of Service (QoS)</a> — at-most-once, at-least-once, exactly-once delivery.</li>
		<li><a href="/mqtt/retained-messages/">Retained messages</a> — the last known value on a topic.</li>
		<li><a href="/mqtt/last-will/">Last Will &amp; Testament</a> — signalling ungraceful disconnects.</li>
		<li><a href="/mqtt/persistent-session/">Persistent sessions</a> — queuing messages for offline clients.</li>
		<li><a href="/mqtt/mqtt-5/">MQTT 5.0</a> — the latest version and what it adds.</li>
		<li><a href="/mqtt/shared-subscriptions/">Shared subscriptions</a> — load-balancing consumers.</li>
		<li><a href="/mqtt/security/">Security</a> — TLS, authentication, and authorization.</li>
	</ul>
</MqttTopicLayout>
```

- [ ] **Step 2: Verify it renders**

Run: `curl -s http://localhost:4321/mqtt/what-is-mqtt/ | grep -o "How MQTT works\|Quick answer\|How TBMQ handles this\|Frequently asked"`
Expected: all four strings present.

- [ ] **Step 3: Commit**

```bash
git add src/pages/mqtt/what-is-mqtt.astro
git commit -m "feat(mqtt-learn): add flagship article - what is MQTT"
```

---

## Task 7: Flagship — `mqtt-vs-kafka.astro`

**Files:**
- Create: `src/pages/mqtt/mqtt-vs-kafka.astro`

- [ ] **Step 1: Create the page**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
import type { FaqItem } from '@components/MqttLearn/FaqAccordion.astro';

const faq: FaqItem[] = [
	{ q: 'Can MQTT replace Kafka?', a: 'Usually no. MQTT connects devices over unreliable networks; Kafka stores and streams high-throughput event data for backend processing. Most architectures use MQTT at the edge and Kafka in the data center rather than choosing one.' },
	{ q: 'Does Kafka support MQTT?', a: 'Kafka does not speak MQTT natively. You bridge them with an MQTT broker or connector. TBMQ is Kafka-backed internally and can forward MQTT messages into Kafka topics.' },
	{ q: 'How do I connect MQTT to Kafka?', a: 'Run an MQTT broker that publishes incoming messages to Kafka, or use a Kafka connector. Because TBMQ already uses Kafka internally, bridging MQTT device traffic to your own Kafka topics is straightforward.' },
	{ q: 'Is MQTT faster than Kafka?', a: 'They optimize for different things. MQTT minimizes per-message overhead and latency for many small device messages; Kafka maximizes sustained throughput and durable retention for backend streams.' },
];
---

<MqttTopicLayout slug="mqtt-vs-kafka" faq={faq}>
	<h2>What each one is for</h2>
	<p>
		<strong>MQTT</strong> is a messaging <em>protocol</em>. It connects large numbers of devices to
		a broker over constrained, unreliable networks and pushes small messages with minimal overhead.
		<strong>Apache Kafka</strong> is a distributed <em>event-streaming platform</em> — a durable,
		replayable log that backend systems use to move and process high-throughput data. One lives at
		the edge; the other lives in the data center.
	</p>

	<h2>MQTT vs Kafka at a glance</h2>
	<div class="overflow-x">
		<table>
			<thead>
				<tr><th>&nbsp;</th><th>MQTT</th><th>Apache Kafka</th></tr>
			</thead>
			<tbody>
				<tr><td>Type</td><td>Pub/sub messaging protocol</td><td>Distributed event-streaming log</td></tr>
				<tr><td>Primary use</td><td>Device connectivity at the edge</td><td>Backend data pipelines &amp; analytics</td></tr>
				<tr><td>Clients</td><td>Millions of lightweight devices</td><td>Fewer high-throughput services</td></tr>
				<tr><td>Network</td><td>Unreliable, low-bandwidth</td><td>Reliable data-center links</td></tr>
				<tr><td>Retention / replay</td><td>Not built in (broker-dependent)</td><td>Core feature — durable, replayable log</td></tr>
				<tr><td>Delivery</td><td>QoS 0 / 1 / 2</td><td>At-least-once / exactly-once (config)</td></tr>
			</tbody>
		</table>
	</div>

	<h2>When to use which</h2>
	<p>
		Use <strong>MQTT</strong> when you need to connect and command devices in the field — telemetry,
		presence, low-latency control. Use <strong>Kafka</strong> when you need to durably store, buffer,
		and process large streams of events across backend services. Choosing "MQTT or Kafka" is usually
		the wrong question.
	</p>

	<h2>Using them together</h2>
	<p>
		The common pattern is a pipeline: devices publish over MQTT to a broker, and the broker forwards
		that data into Kafka for storage, stream processing, and analytics. This gives you MQTT's
		edge-friendly connectivity <em>and</em> Kafka's durable, replayable backbone. TBMQ is built on
		exactly this idea — it uses Kafka internally for durability and can bridge MQTT traffic to your
		Kafka topics.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 2: Verify**

Run: `curl -s http://localhost:4321/mqtt/mqtt-vs-kafka/ | grep -o "at a glance\|Using them together\|How TBMQ handles this"`
Expected: all three present.

- [ ] **Step 3: Commit**

```bash
git add src/pages/mqtt/mqtt-vs-kafka.astro
git commit -m "feat(mqtt-learn): add flagship article - MQTT vs Kafka"
```

---

## Task 8: Flagship — `shared-subscriptions.astro`

**Files:**
- Create: `src/pages/mqtt/shared-subscriptions.astro`

- [ ] **Step 1: Create the page**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
import type { FaqItem } from '@components/MqttLearn/FaqAccordion.astro';

const faq: FaqItem[] = [
	{ q: 'What is the $share prefix?', a: 'The $share/<group>/<topic> prefix marks a subscription as shared. Every client that subscribes with the same group name and topic joins one consumer group, and the broker delivers each matching message to only one member of that group.' },
	{ q: 'Do all brokers support shared subscriptions?', a: 'Shared subscriptions are standard in MQTT 5.0, and some brokers also supported them as an extension in MQTT 3.1.1. Support varies, so check your broker. TBMQ supports shared subscriptions.' },
	{ q: 'How is a message distributed within a group?', a: 'The broker picks one member of the shared group per message (commonly round-robin). Different brokers may use slightly different selection strategies.' },
	{ q: 'Do shared subscriptions guarantee ordering?', a: 'Because messages are spread across multiple consumers, strict global ordering is not guaranteed. Design consumers to tolerate out-of-order or parallel processing.' },
];
---

<MqttTopicLayout slug="shared-subscriptions" faq={faq}>
	<h2>The problem shared subscriptions solve</h2>
	<p>
		A normal MQTT subscription is a broadcast: if ten clients subscribe to the same topic, every
		one of them receives every message. That's perfect for fan-out, but it can't spread load. If a
		single high-traffic topic produces more messages than one consumer can handle, a normal
		subscription gives you no way to share the work.
	</p>

	<h2>How shared subscriptions work</h2>
	<p>
		A shared subscription puts several clients into one <strong>consumer group</strong>. The broker
		then delivers each message to <strong>only one</strong> member of the group, turning the topic
		into a load-balanced work queue. Clients join a group by subscribing to a special topic form:
	</p>
	<p><code>$share/&lt;group-name&gt;/&lt;topic-filter&gt;</code></p>
	<p>
		For example, three worker services that all subscribe to
		<code>$share/workers/sensors/+/data</code> form the <code>workers</code> group. Each reading
		published under <code>sensors/+/data</code> goes to just one of the three workers, so adding a
		fourth worker instantly increases throughput.
	</p>

	<h2>MQTT 5.0 vs 3.1.1</h2>
	<p>
		Shared subscriptions are a standard feature of <a href="/mqtt/mqtt-5/">MQTT 5.0</a>. Some
		brokers also offered them as a non-standard extension under MQTT 3.1.1 using the same
		<code>$share</code> convention, so behavior can vary by broker on 3.1.1.
	</p>

	<h2>Common use cases and pitfalls</h2>
	<ul>
		<li><strong>Scaling consumers:</strong> worker pools that process high-volume ingestion.</li>
		<li><strong>High availability:</strong> if one consumer drops, others in the group keep working.</li>
		<li><strong>Watch ordering:</strong> messages are spread across consumers, so don't rely on strict global order.</li>
		<li><strong>Mind QoS:</strong> combine with the right <a href="/mqtt/qos/">QoS level</a> for your delivery guarantees.</li>
	</ul>
</MqttTopicLayout>
```

- [ ] **Step 2: Verify**

Run: `curl -s http://localhost:4321/mqtt/shared-subscriptions/ | grep -o "How shared subscriptions work\|\\$share\|How TBMQ handles this"`
Expected: all present.

- [ ] **Step 3: Commit**

```bash
git add src/pages/mqtt/shared-subscriptions.astro
git commit -m "feat(mqtt-learn): add flagship article - shared subscriptions"
```

---

## Task 9: Scaffold pages (8 short-form)

Each scaffold is a complete, shippable short-form page: the layout already renders the hero, quick-answer, "How TBMQ handles this", related, and CTA from the registry — the body slot just adds one "Why it matters" section. Repeat the pattern below for each slug, changing only the `slug` and the two paragraphs.

**Files:**
- Create: `src/pages/mqtt/qos.astro`
- Create: `src/pages/mqtt/mqtt-5.astro`
- Create: `src/pages/mqtt/persistent-session.astro`
- Create: `src/pages/mqtt/topics.astro`
- Create: `src/pages/mqtt/retained-messages.astro`
- Create: `src/pages/mqtt/last-will.astro`
- Create: `src/pages/mqtt/security.astro`
- Create: `src/pages/mqtt/websocket.astro`

- [ ] **Step 1: `qos.astro`**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
---

<MqttTopicLayout slug="qos">
	<h2>The three QoS levels</h2>
	<ul>
		<li><strong>QoS 0 — at most once:</strong> the message is sent once with no acknowledgement. Fastest and lightest, but a message can be lost if the connection drops.</li>
		<li><strong>QoS 1 — at least once:</strong> the message is retried until acknowledged, so it always arrives — but it may arrive more than once, so consumers should be idempotent.</li>
		<li><strong>QoS 2 — exactly once:</strong> a four-step handshake guarantees the message is delivered a single time. Strongest guarantee, highest overhead.</li>
	</ul>
	<h2>Choosing a level</h2>
	<p>
		Use QoS 0 for frequent, disposable readings where an occasional gap doesn't matter; QoS 1 for
		data you can't lose but can de-duplicate; and QoS 2 for commands that must apply exactly once.
		Higher QoS costs more round-trips and broker state, so match the level to the message's value.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 2: `mqtt-5.astro`**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
---

<MqttTopicLayout slug="mqtt-5">
	<h2>What MQTT 5.0 adds</h2>
	<ul>
		<li><strong>Reason codes &amp; user properties:</strong> acknowledgements now explain <em>why</em> something failed, and you can attach custom key/value metadata to messages.</li>
		<li><strong>Topic aliases:</strong> replace long topic strings with a short integer to cut bandwidth.</li>
		<li><strong>Session &amp; message expiry:</strong> set how long sessions and queued messages live.</li>
		<li><strong>Shared subscriptions &amp; flow control:</strong> standardized load balancing and per-client receive limits.</li>
	</ul>
	<h2>Should you upgrade from 3.1.1?</h2>
	<p>
		MQTT 5.0 is backward-compatible in spirit and keeps the lightweight pub/sub core, so new
		projects should prefer it for the better error reporting and control. Many deployments run 3.1.1
		and 5.0 side by side during migration.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 3: `persistent-session.astro`**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
---

<MqttTopicLayout slug="persistent-session">
	<h2>Clean start vs persistent session</h2>
	<p>
		When a client connects with a persistent session, the broker remembers its subscriptions and
		queues QoS 1/2 messages while it is offline, delivering them on reconnect. With a clean session
		(MQTT 3.1.1) or Clean Start = true (MQTT 5.0), the broker discards any prior state and begins
		fresh.
	</p>
	<h2>Why it matters</h2>
	<p>
		Persistent sessions keep intermittently connected devices in sync without missing messages — but
		they cost broker storage per client, so they must scale carefully. In MQTT 5.0, a session-expiry
		interval lets you bound how long an offline session is retained.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 4: `topics.astro`**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
---

<MqttTopicLayout slug="topics">
	<h2>Topic hierarchy and wildcards</h2>
	<p>
		Topics are UTF-8 strings split into levels by a forward slash, such as
		<code>sensors/floor1/temp</code>. Publishers use a full topic; subscribers can use wildcards:
	</p>
	<ul>
		<li><code>+</code> — single-level wildcard, e.g. <code>sensors/+/temp</code> matches every floor.</li>
		<li><code>#</code> — multi-level wildcard, e.g. <code>sensors/#</code> matches everything under <code>sensors</code>. It must be the last character.</li>
	</ul>
	<h2>Naming best practices</h2>
	<p>
		Keep topics hierarchical and specific, avoid leading slashes and spaces, and don't publish to
		wildcard topics. A consistent scheme (for example <code>site/area/device/metric</code>) makes
		subscriptions and access control far easier to reason about.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 5: `retained-messages.astro`**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
---

<MqttTopicLayout slug="retained-messages">
	<h2>How the retain flag works</h2>
	<p>
		When a message is published with the retain flag set, the broker stores it as the "last known
		good" value for that topic. Any client that subscribes afterward immediately receives that
		retained message, instead of waiting for the next publish. Publishing an empty payload with the
		retain flag clears it.
	</p>
	<h2>Why it matters</h2>
	<p>
		Retained messages are ideal for state that new subscribers need right away — a device's online
		status, the latest configuration, or the current reading of a sensor — so clients don't start
		up blind.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 6: `last-will.astro`**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
---

<MqttTopicLayout slug="last-will">
	<h2>How Last Will works</h2>
	<p>
		A client registers its Last Will and Testament (LWT) — a topic, payload, QoS, and retain flag —
		when it connects. If the broker detects that the client disconnected ungracefully (for example,
		it stopped responding to keep-alive pings), it publishes that will message on the client's
		behalf. A clean disconnect does not trigger the will.
	</p>
	<h2>Why it matters</h2>
	<p>
		LWT is MQTT's built-in presence mechanism. Combined with a <a href="/mqtt/retained-messages/">retained</a>
		status topic, it lets the rest of your system react the instant a device drops off unexpectedly.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 7: `security.astro`**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
---

<MqttTopicLayout slug="security">
	<h2>The three layers of MQTT security</h2>
	<ul>
		<li><strong>Transport (TLS):</strong> encrypt the connection, typically on port 8883, so credentials and payloads aren't sent in the clear.</li>
		<li><strong>Authentication:</strong> verify who a client is — username/password, X.509 client certificates (mutual TLS), or tokens such as JWT.</li>
		<li><strong>Authorization:</strong> control which topics each client may publish to or subscribe from.</li>
	</ul>
	<h2>Why it matters</h2>
	<p>
		Because MQTT brokers often sit at the boundary between the internet and your fleet, all three
		layers matter. Encrypt in transit, authenticate every client, and scope topic access to the
		minimum each client needs.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 8: `websocket.astro`**

```astro
---
import MqttTopicLayout from '@components/MqttLearn/MqttTopicLayout.astro';
---

<MqttTopicLayout slug="websocket">
	<h2>Why MQTT over WebSocket</h2>
	<p>
		Browsers can't open raw TCP sockets, so they can't speak plain MQTT. MQTT over WebSocket wraps
		the exact same MQTT packets inside a WebSocket connection, letting web apps publish and subscribe
		directly. Brokers usually expose it on port 8083/8084 (WS) or 8084/8085 (WSS for TLS).
	</p>
	<h2>Why it matters</h2>
	<p>
		WebSocket support lets you build live dashboards and controls that talk to the broker straight
		from the browser — no gateway in between. You can try this hands-on in the
		<a href="/live-demo/">TBMQ live demo</a>.
	</p>
</MqttTopicLayout>
```

- [ ] **Step 9: Verify all scaffolds render**

Run:
```bash
for s in qos mqtt-5 persistent-session topics retained-messages last-will security websocket; do
  echo -n "$s: "; curl -s "http://localhost:4321/mqtt/$s/" | grep -c "How TBMQ handles this";
done
```
Expected: each prints `1`.

- [ ] **Step 10: Commit**

```bash
git add src/pages/mqtt/qos.astro src/pages/mqtt/mqtt-5.astro src/pages/mqtt/persistent-session.astro src/pages/mqtt/topics.astro src/pages/mqtt/retained-messages.astro src/pages/mqtt/last-will.astro src/pages/mqtt/security.astro src/pages/mqtt/websocket.astro
git commit -m "feat(mqtt-learn): add 8 short-form scaffold topic pages"
```

---

## Task 10: Navigation — "Learn" dropdown after Company

**Files:**
- Modify: `src/data/navigation.ts`

- [ ] **Step 1: Insert the Learn item after Company in `mainNavItems`**

Change the array so Learn sits between Company and Docs:
```ts
export const mainNavItems: NavItem[] = [
	{ label: 'Product', href: '/product/' },
	{ label: 'Live Demo', href: '/live-demo/' },
	{ label: 'Performance', href: '/performance/' },
	{ label: 'Company', submenuId: 'nav-company' },
	{ label: 'Learn', submenuId: 'nav-learn' },
	{ label: 'Docs', href: '/docs/mqtt-broker/pe/' },
	{ label: 'Blog', href: '/blog/' },
];
```

- [ ] **Step 2: Add the `learnSubmenu` and register it**

Import the marquee topics at the top of the file and build the submenu from the registry (single generic column: the 6 marquee guides + a "Browse all" link). Add after `companySubmenu`:

```ts
import { marqueeTopics, topicHref } from './mqttLearn';

// Learn submenu (curated: marquee guides + browse-all link to the hub)
export const learnSubmenu: SubMenu = {
	id: 'nav-learn',
	className: 'learn',
	groups: [
		{
			items: [
				...marqueeTopics.map((t) => ({
					href: topicHref(t.slug),
					heading: t.navLabel,
					linkClass: 'small-link',
				})),
				{
					href: '/mqtt/',
					heading: 'Browse all guides →',
					linkClass: 'small-link',
				},
			],
		},
	],
};
```

Then extend `allSubmenus`:
```ts
export const allSubmenus: SubMenu[] = [companySubmenu, learnSubmenu];
```

> The generic submenu branch in `Navigation.astro` renders `SubMenuItem`s with an optional `icon` (omitted here) and `heading` inside a single `.column` — matching the existing Company menu. No changes to `Navigation.astro` are needed.

- [ ] **Step 3: Verify the dropdown markup renders**

Run: `pnpm check && curl -s http://localhost:4321/product/ | grep -o 'id="nav-learn"\|Browse all guides\|What is MQTT?'`
Expected: `0 errors`, plus matches for `id="nav-learn"`, `Browse all guides`, and `What is MQTT?`.

- [ ] **Step 4: Commit**

```bash
git add src/data/navigation.ts
git commit -m "feat(mqtt-learn): add Learn dropdown to top navigation after Company"
```

---

## Task 11: Full verification + visual QA

**Files:** none (verification only)

- [ ] **Step 1: Type-check, lint, slugcheck**

Run: `pnpm check && pnpm lint:eslint && pnpm lint:slugcheck`
Expected: all pass, `0 errors`.

- [ ] **Step 2: Ask the user before building, then build + link-check**

Ask: "Run `pnpm build:fast` + `pnpm lint:linkcheck` to verify, or skip?" On approval:
Run: `pnpm lint:linkcheck`
Expected: build completes; link checker reports no broken links. (Pay attention to the internal `/mqtt/*`, `/product/`, `/live-demo/`, `/installations/`, and `/docs/mqtt-broker/` links used across the pages.)

- [ ] **Step 3: Visual QA with headless Chrome**

Capture the hub, one flagship, and the Learn dropdown at desktop + mobile widths and review them:
```bash
mkdir -p /tmp/mqtt-shots
for path in mqtt mqtt/what-is-mqtt; do
  name=$(echo "$path" | tr '/' '-')
  google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=1400,3200 --virtual-time-budget=5000 \
    --screenshot=/tmp/mqtt-shots/$name-desktop.png "http://localhost:4321/$path/" 2>/dev/null
  google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=390,4000 --virtual-time-budget=5000 \
    --screenshot=/tmp/mqtt-shots/$name-mobile.png "http://localhost:4321/$path/" 2>/dev/null
done
```
Then open the PNGs (Read tool). Confirm: single-column layout, green accent tokens, quick-answer box, "How TBMQ handles this" block, FAQ accordion, related grid, CTA band; header has the marketing box-shadow and no theme toggle; responsive stacking on mobile. Fix any spacing/token issues in the relevant component and re-shoot.

- [ ] **Step 4: Final commit (if screenshots prompted fixes)**

```bash
git add -A
git commit -m "fix(mqtt-learn): visual polish from QA pass"
```

- [ ] **Step 5: Offer to open a PR**

Push `feature/mqtt-learn-hub` and offer to open a PR into `develop` (or merge per the user's preference).

---

## Self-review

**Spec coverage:**
- Hub + 11 topic pages, 3 full + 8 short → Tasks 4, 6, 7, 8, 9. ✓
- Content registry (single source of truth) → Task 1. ✓
- Single-column template + shared components → Tasks 2, 3. ✓
- Learn curated dropdown after Company → Task 10. ✓
- SEO: OG allowlist, WebPage/Breadcrumb JSON-LD, FAQPage JSON-LD, sitemap (automatic) → Tasks 3 (layout jsonLd), 2 (FaqAccordion), 5 (allowlist). ✓
- Anti-cannibalization (marketing framing + links into docs) → HowTbmqBlock + in-body doc links across Tasks 6–9. ✓
- Marketing header treatment for the new page id → Task 5. ✓
- Verification (check/eslint/slugcheck/linkcheck/build/visual) → Task 11. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code; every page has real copy. ✓

**Type consistency:** `getTopic`, `topicHref`, `relatedTopics`, `marqueeTopics`, `mqttTopics`, `MqttTopic`, `FaqItem` are defined in Tasks 1–2 and used with matching names/signatures in Tasks 3, 6–10. `MqttTopicLayout` prop is `{ slug, faq }`; pages pass exactly those. `FaqItem` is `{ q, a }` throughout. ✓

**Known adaptation:** TDD unit tests are replaced by the repo's real gates (astro check / eslint / slugcheck / linkcheck / rendered-HTML grep / screenshots) because the repo has no unit-test runner — introducing one would violate "follow existing patterns."

**Open follow-ups (out of scope, noted for later):** deepen the 8 short-form pages; optional `noindex` flag on scaffolds if thin-content SEO becomes a concern; per-topic OG eyebrow mapping in `ogContext.ts`.
