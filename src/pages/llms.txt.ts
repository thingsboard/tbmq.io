import type { APIRoute } from 'astro';
import { PROD_ORIGIN } from '~/consts';
import { learnNavTopics, mqttTopics, topicHref } from '~/data/mqttLearn';
import { TBMQ_PE_VER, TBMQ_VER } from '~/data/versions';

export const prerender = true;

const SITE_URL = PROD_ORIGIN;

const HEADER = `# TBMQ

> TBMQ is an open-source MQTT broker by ThingsBoard, engineered for high-throughput, fault-tolerant MQTT messaging at IoT scale.

- TBMQ implements MQTT 3.1, 3.1.1, and 5.0 over TCP (1883) and WebSocket (8084) listeners, with TLS (8883) and secure WebSocket (8085) available.
- Published benchmarks: 100M concurrent connections on a single cluster, 3M+ messages/sec on a single node, and 1M msg/sec point-to-point with persistent clients.
- Architecture: symmetric, masterless nodes that coordinate exclusively through Apache Kafka — the durability backbone. Redis/Valkey stores messages for persistent DEVICE clients and PostgreSQL holds metadata.
- A publish is acknowledged only after Kafka has persisted it, so an acknowledged QoS 1/2 message survives the loss of a broker node.
- Clients are modelled as DEVICE (many low-throughput connections) or APPLICATION (backend consumers with dedicated Kafka topics); the type decides how persistent messages are stored and delivered.
- Authentication providers: Basic, SCRAM (MQTT 5.0), X.509 certificate chain, JWT, and external HTTP — combined with topic-level authorization rules (ACL).
- Integrations forward MQTT traffic to external HTTP endpoints, MQTT brokers, and Kafka topics, executed by a separate Integration Executor service.
- Two editions share one documentation tree: Community Edition (open source) and Professional Edition, which adds SSO/OAuth 2.0, RBAC, audit logs, white-labeling, and a managed private cloud option.`;

interface LinkEntry {
	/** Docs-collection slug ("docs/…") or a site-absolute path ("/pricing/"). */
	path: string;
	title: string;
	description: string;
}

const DOC_PAGES: LinkEntry[] = [
	{
		path: 'docs/pe',
		title: 'TBMQ documentation — home',
		description: 'Top-level entry point for the TBMQ documentation.',
	},
	{
		path: 'docs/pe/why-tbmq',
		title: 'Why TBMQ?',
		description: 'Design goals, guarantees, and how TBMQ compares to other MQTT brokers.',
	},
	{
		path: 'docs/pe/getting-started',
		title: 'Getting started',
		description: 'Connect an MQTT client, publish and subscribe, and set up client credentials end to end.',
	},
	{
		path: 'docs/pe/architecture',
		title: 'Architecture',
		description: 'Components, Kafka topics, PUBLISH lifecycle, and the durability guarantees of a TBMQ cluster.',
	},
	{
		path: 'docs/pe/concepts/client-types',
		title: 'Client types',
		description: 'DEVICE vs APPLICATION clients — persistence model, throughput, and when to use each.',
	},
	{
		path: 'docs/pe/concepts/sessions',
		title: 'Sessions',
		description: 'Clean and persistent MQTT sessions, session expiry, and the state TBMQ keeps per client.',
	},
	{
		path: 'docs/pe/concepts/qos',
		title: 'Delivery guarantees',
		description: 'QoS 0, 1, and 2 handshakes as TBMQ implements them, and how to pick a level.',
	},
	{
		path: 'docs/pe/concepts/topics',
		title: 'Topics and wildcards',
		description: 'Topic structure, single- and multi-level wildcards, and topic design guidelines.',
	},
	{
		path: 'docs/pe/concepts/clustering',
		title: 'Clustering',
		description: 'Masterless nodes, Kafka-based coordination, and horizontal scaling.',
	},
	{
		path: 'docs/pe/installation',
		title: 'Installation options',
		description: 'Docker, Docker Compose, Kubernetes, Helm, and managed cloud deployment paths.',
	},
	{
		path: 'docs/pe/installation/config',
		title: 'Configuration reference',
		description: 'Broker configuration parameters, environment variables, and tuning options.',
	},
	{
		path: 'docs/pe/security/overview',
		title: 'Security model',
		description: 'Authentication providers and their execution order, authorization rules, and TLS/mTLS listeners.',
	},
	{
		path: 'docs/pe/user-guide',
		title: 'User guide',
		description: 'Protocol features, client management, and the admin UI, task by task.',
	},
	{
		path: 'docs/pe/integrations',
		title: 'Integrations',
		description: 'Forward MQTT traffic to external systems over HTTP, MQTT, and Kafka.',
	},
	{
		path: 'docs/pe/rest-api',
		title: 'REST API',
		description: 'HTTP API surface for automating broker administration and monitoring.',
	},
	{
		path: 'docs/pe/reference',
		title: 'Reference',
		description: 'Validated system design and high-load performance benchmarks for production sizing.',
	},
	{
		path: 'docs',
		title: 'TBMQ Community Edition documentation',
		description: 'Same documentation tree scoped to the open-source edition; PE-only pages are absent here.',
	},
];

const PRODUCT_PAGES: LinkEntry[] = [
	{
		path: '/',
		title: 'TBMQ — open-source MQTT broker',
		description: 'Product overview, feature highlights, and the CE vs PE comparison table.',
	},
	{
		path: '/product/',
		title: 'Distributed MQTT broker architecture',
		description:
			'How the masterless cluster, Kafka-backed durability, and in-memory subscription matching fit together.',
	},
	{
		path: '/performance/',
		title: 'MQTT broker benchmarks',
		description:
			'100M connections, 3M+ msg/sec single node, and 1M msg/sec point-to-point — reproducible setups and results.',
	},
	{
		path: '/installations/',
		title: 'Installation options',
		description: 'Pick a deployment path: Docker, Docker Compose, Kubernetes, Helm, or a cloud cluster.',
	},
	{
		path: '/live-demo/',
		title: 'Live demo',
		description: 'Free public broker at demo.tbmq.io — connect any MQTT client without signing up.',
	},
	{
		path: '/pricing/',
		title: 'Pricing',
		description: 'Community Edition, self-managed Professional Edition, and managed private cloud plans.',
	},
	{
		path: '/blog/',
		title: 'Blog',
		description: 'Release announcements, benchmarks, and MQTT engineering write-ups.',
	},
	{
		path: '/contact-us/',
		title: 'Contact us',
		description: 'Reach the TBMQ team about licensing, support, or a proof of concept.',
	},
];

const OPTIONAL_LINKS = [
	{
		label: 'TBMQ on GitHub',
		url: 'https://github.com/thingsboard/tbmq',
		description: 'source code of the Community Edition (Apache 2.0)',
	},
	{
		label: 'TBMQ issue tracker',
		url: 'https://github.com/thingsboard/tbmq/issues',
		description: 'bug reports and feature requests',
	},
	{
		label: 'TBMQ releases',
		url: 'https://github.com/thingsboard/tbmq/releases',
		description: 'release notes and downloadable artifacts',
	},
	{
		label: 'TBMQ on Docker Hub',
		url: 'https://hub.docker.com/r/thingsboard/tbmq',
		description: 'official broker images',
	},
	{
		label: 'TBMQ Slack community',
		url: 'https://join.slack.com/t/tbmq/shared_invite/zt-31kk3315e-5jtPw8YAKskq1KkUqTrTyQ',
		description: 'questions and discussion with users and contributors',
	},
	{
		label: 'MQTT performance test tool',
		url: 'https://github.com/thingsboard/tb-mqtt-perf-tests',
		description: 'load-generation tooling used for the published benchmarks',
	},
];

function toUrl(path: string): string {
	if (path.startsWith('/')) return `${SITE_URL}${path}`;
	return `${SITE_URL}/${path.replace(/\/index$/, '')}/`;
}

function formatLinks(entries: LinkEntry[]): string {
	return entries.map((e) => `- [${e.title}](${toUrl(e.path)}): ${e.description}`).join('\n');
}

export const GET: APIRoute = () => {
	if (process.env.SKIP_LLMS) {
		return new Response('', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
	}

	const learnHub = [
		`- [MQTT learn hub](${SITE_URL}/mqtt/): ${mqttTopics.length} guides to the MQTT protocol itself — concepts, MQTT 5.0 features, security, and comparisons with other protocols.`,
		...learnNavTopics.map((t) => `- [${t.title}](${SITE_URL}${topicHref(t.slug)}): ${t.cardSummary}`),
	].join('\n');

	const docSets = `- [Documentation catalog](${SITE_URL}/llms-small.txt): every documentation page and MQTT guide — title, description, canonical URL. Fetch a page URL directly to read its body.`;

	const notes = [
		`- Current releases: TBMQ Community Edition ${TBMQ_VER}, TBMQ Professional Edition ${TBMQ_PE_VER}.`,
		'- Documentation links point at the Professional Edition tree. It is a superset of Community Edition and both editions share the same source content, so any CE page exists at the same path without the `/pe` segment (`/docs/pe/getting-started/` → `/docs/getting-started/`).',
		'- Pages under `/docs/` are reference documentation for running TBMQ; pages under `/mqtt/` explain the MQTT protocol itself and are product-neutral.',
		'- This file and the catalog are generated at build time from the same sources as the site.',
	].join('\n');

	const optional = OPTIONAL_LINKS.map(
		(l) => `- [${l.label}](${l.url})${l.description ? `: ${l.description}` : ''}`
	).join('\n');

	const body = [
		HEADER,
		'## Documentation',
		formatLinks(DOC_PAGES),
		'## MQTT protocol guides',
		learnHub,
		'## Product',
		formatLinks(PRODUCT_PAGES),
		'## Documentation Sets',
		docSets,
		'## Notes',
		notes,
		'## Optional',
		optional,
	].join('\n\n');

	return new Response(body + '\n', {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
