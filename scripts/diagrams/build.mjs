/**
 * Generates the theme-aware light/dark SVG pairs for the TBMQ Architecture page
 * from the shared toolkit in ./kit.mjs.
 *
 *   node scripts/diagrams/build.mjs            → write SVGs to src/assets/…/architecture
 *   node scripts/diagrams/build.mjs --preview  → also rasterise PNGs to <scratch> for QA
 *   node scripts/diagrams/build.mjs --only hero → build a single diagram
 *
 * The rendered SVGs are committed alongside this source.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { makeKit, THEMES, rectC, top, bottom, left, right } from './kit.mjs';
import * as flows from './flows.mjs';
import * as extras from './extras.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../src/assets/images/docs/mqtt-broker/architecture');
const PREVIEW = resolve(
	process.env.SCRATCH ||
		'/tmp/claude-1000/-home-dlandiak-projects-tbmq-io/d18d02f1-4b2a-4e48-9d34-796b5b631d43/scratchpad',
	'diagram-preview'
);

// =============================================================================
// 1. HERO — top-level layered component map
// =============================================================================
function hero(kit) {
	const W = 1360,
		H = 900;
	const k = kit;
	const P = [];

	// --- component rectangles ---
	const devices = rectC(54, 300, 176, 92);
	const apps = rectC(54, 432, 176, 92);
	const clientsGroup = rectC(34, 250, 214, 300);

	const node = rectC(300, 176, 520, 484);
	const netty = rectC(330, 252, 200, 120);
	const actor = rectC(330, 456, 200, 96);
	const dispatch = rectC(560, 252, 240, 120);
	const trie = rectC(560, 456, 240, 96);

	const shared = rectC(940, 224, 272, 436);
	const kafka = rectC(964, 256, 224, 140);
	const redis = rectC(964, 456, 224, 82);
	const pg = rectC(964, 560, 224, 82);

	const webui = rectC(560, 62, 240, 82);
	const ie = rectC(560, 736, 240, 88);
	const ext = rectC(964, 736, 224, 88);

	// --- connectors (drawn under cards) ---
	// clients <-> netty
	P.push(
		k.connector({
			from: right(devices),
			to: [netty.x, netty.y + 42],
			type: 'flow',
			label: 'PUBLISH',
			labelSide: 'above',
		})
	);
	P.push(
		k.connector({ from: [netty.x, netty.y + 92], to: right(apps), type: 'flow', label: 'deliver', labelSide: 'below' })
	);
	// netty -> actor
	P.push(k.connector({ from: bottom(netty), to: top(actor), type: 'flow', label: 'decode' }));
	// actor -> dispatcher (diagonal through the row gap)
	P.push(
		k.connector({
			from: [actor.x + actor.w - 24, actor.y],
			to: [dispatch.x + 24, dispatch.y + dispatch.h],
			type: 'flow',
			label: 'publish',
		})
	);
	// dispatcher <-> trie (query / results)
	P.push(k.connector({ from: [dispatch.cx - 42, dispatch.y + dispatch.h], to: [trie.cx - 42, trie.y], type: 'ack' }));
	P.push(
		k.connector({
			from: [trie.cx + 42, trie.y],
			to: [dispatch.cx + 42, dispatch.y + dispatch.h],
			type: 'flow',
			label: 'match subs',
		})
	);
	// dispatcher <-> kafka (persist / consume) — parallel arrows in the gap
	P.push(
		k.connector({
			from: [dispatch.x + dispatch.w, dispatch.y + 40],
			to: [kafka.x, kafka.y + 44],
			type: 'flow',
			label: 'persist',
			labelSide: 'above',
		})
	);
	P.push(
		k.connector({
			from: [kafka.x, kafka.y + 96],
			to: [dispatch.x + dispatch.w, dispatch.y + 96],
			type: 'flow',
			label: 'consume',
			labelSide: 'below',
		})
	);
	// kafka -> redis
	P.push(k.connector({ from: bottom(kafka), to: top(redis), type: 'flow' }));
	// kafka -> ie (down the node/shared gap)
	P.push(
		k.connector({
			from: [kafka.x, kafka.y + kafka.h - 24],
			to: top(ie),
			route: [
				[900, kafka.y + kafka.h - 24],
				[900, 704],
				[ie.cx, 704],
			],
			type: 'flow',
			label: 'tbmq.msg.ie',
		})
	);
	// ie -> external
	P.push(k.connector({ from: right(ie), to: left(ext), type: 'flow' }));
	// webui -> dispatcher (admin) + postgres (metadata, down the far right)
	P.push(k.connector({ from: bottom(webui), to: top(dispatch), type: 'flow', label: 'admin' }));
	P.push(
		k.connector({
			from: [webui.x + webui.w, webui.cy],
			to: right(pg),
			route: [
				[1250, webui.cy],
				[1250, pg.cy],
			],
			type: 'flow',
			label: 'metadata',
			labelSide: 'above',
		})
	);

	// --- containers ---
	P.push(k.groupBox({ ...clientsGroup, label: 'MQTT clients', kind: 'client' }));
	P.push(k.groupBox({ ...node, label: 'TBMQ node', kind: 'core' }));
	P.push(k.groupBox({ ...shared, label: 'Shared backbone & storage', kind: 'kafka', labelKind: 'kafka' }));

	// --- cards ---
	P.push(k.card({ ...devices, kind: 'client', icon: 'clients', title: 'Devices', sub: 'millions of clients' }));
	P.push(k.card({ ...apps, kind: 'client', icon: 'app', title: 'Applications', sub: 'backend consumers' }));

	P.push(
		k.card({
			...netty,
			kind: 'transport',
			icon: 'netty',
			title: 'Netty',
			sub: 'MQTT transport · NIO',
			topic: 'TCP·TLS·WS·WSS',
		})
	);
	P.push(k.card({ ...actor, kind: 'core', icon: 'actor', title: 'Actor system', sub: 'client + device actors' }));
	P.push(k.card({ ...dispatch, kind: 'core', icon: 'dispatch', title: 'Message dispatcher', sub: 'produce · route' }));
	P.push(k.card({ ...trie, kind: 'core', icon: 'trie', title: 'Subscription Trie', sub: 'topic matching' }));

	P.push(
		k.card({
			...kafka,
			kind: 'kafka',
			icon: 'kafka',
			title: 'Apache Kafka',
			sub: 'durability backbone',
			topic: 'tbmq.msg.all',
		})
	);
	P.push(k.card({ ...redis, kind: 'redis', icon: 'redis', title: 'Redis / Valkey', sub: 'persistent DEVICE msgs' }));
	P.push(k.card({ ...pg, kind: 'pg', icon: 'pg', title: 'PostgreSQL', sub: 'users · credentials · metadata' }));

	P.push(k.card({ ...webui, kind: 'transport', icon: 'webui', title: 'Web UI / REST API' }));
	P.push(k.card({ ...ie, kind: 'ie', icon: 'ie', title: 'Integration Executor', sub: 'separate microservice' }));
	P.push(k.card({ ...ext, kind: 'transport', icon: 'lb', title: 'External systems', sub: 'HTTP · MQTT · Kafka' }));

	// --- legend ---
	P.push(
		k.legend(300, 858, [
			{ type: 'flow', label: 'message flow' },
			{ type: 'ack', label: 'acknowledgement / query' },
		])
	);

	return k.frame(W, H, P);
}

// =============================================================================
const DIAGRAMS = {
	hero: { file: 'tbmq-architecture', build: hero },
	'non-persistent-dev': { file: 'tbmq-non-persistent-dev', build: flows.nonPersistentDev },
	'non-persist-dev-cluster': { file: 'tbmq-non-persist-dev-cluster', build: flows.nonPersistDevCluster },
	'persistent-dev': { file: 'tbmq-persistent-dev', build: flows.persistentDev },
	'persist-dev-cluster': { file: 'tbmq-persist-dev-cluster', build: flows.persistDevCluster },
	app: { file: 'tbmq-app', build: flows.app },
	'app-cluster': { file: 'tbmq-app-cluster', build: flows.appCluster },
	'publish-lifecycle': { file: 'tbmq-publish-lifecycle', build: extras.publishLifecycle },
	'client-type-tree': { file: 'tbmq-client-type-decision', build: extras.clientTypeTree },
	'persistence-model': { file: 'tbmq-persistence-model', build: extras.persistenceModel },
	'subscription-trie': { file: 'tbmq-subscription-trie', build: extras.subscriptionTrie },
	'kafka-topics-map': { file: 'tbmq-kafka-topics', build: extras.kafkaTopicsMap },
	'standalone-vs-cluster': { file: 'tbmq-standalone-vs-cluster', build: extras.standaloneVsCluster },
	'actor-system': { file: 'tbmq-actor-system', build: extras.actorSystem },
	'qos-durability': { file: 'tbmq-qos-durability', build: extras.qosDurability },
	'integration-executor': { file: 'tbmq-integration-executor', build: extras.integrationExecutor },
};

async function rasterize(svg, outPath) {
	const sharp = (await import('sharp')).default;
	await sharp(Buffer.from(svg)).png().toFile(outPath);
}

async function main() {
	const args = process.argv.slice(2);
	const preview = args.includes('--preview');
	const onlyIdx = args.indexOf('--only');
	const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

	mkdirSync(OUT, { recursive: true });
	if (preview) mkdirSync(PREVIEW, { recursive: true });

	for (const [id, def] of Object.entries(DIAGRAMS)) {
		if (only && only !== id) continue;
		for (const themeName of ['light', 'dark']) {
			const kit = makeKit(THEMES[themeName]);
			const svg = def.build(kit);
			const suffix = themeName === 'dark' ? '-dark' : '';
			const svgPath = resolve(OUT, `${def.file}${suffix}.svg`);
			writeFileSync(svgPath, svg);
			if (preview) {
				await rasterize(svg, resolve(PREVIEW, `${def.file}${suffix}.png`));
			}
			console.log(`  ${themeName.padEnd(5)}  ${def.file}${suffix}.svg`);
		}
	}
	console.log('done.');
}

main();
