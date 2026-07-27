/**
 * Generates the theme-aware light/dark SVG pairs for the TBMQ Architecture page
 * from the shared toolkit in ./kit.mjs.
 *
 *   node scripts/diagrams/build.mjs            → write SVGs to src/assets/…/architecture
 *   node scripts/diagrams/build.mjs --preview  → also rasterise PNGs to <scratch> for QA
 *   node scripts/diagrams/build.mjs --only hero → build a single diagram
 *
 * The rendered SVGs are committed alongside this source.
 *
 * Each diagram was reviewed against a clean-room alternative rendered from the
 * blueprints in docs/superpowers/report/tbmq-architecture-diagram-blueprints.md.
 * That comparison is finished: the winners are the DIAGRAMS registry below, two
 * of which build from ./alt.mjs. The side-by-side `--alt` output folder is gone.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { makeKit, THEMES } from './kit.mjs';
import * as flows from './flows.mjs';
import * as extras from './extras.mjs';
import * as alt from './alt.mjs';
import { heroDc } from './hero-dc.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../src/assets/images/docs/mqtt-broker/architecture');
const PREVIEW = resolve(
	process.env.SCRATCH ||
		'/tmp/claude-1000/-home-dlandiak-projects-tbmq-io/d18d02f1-4b2a-4e48-9d34-796b5b631d43/scratchpad',
	'diagram-preview'
);

// =============================================================================
const DIAGRAMS = {
	hero: { file: 'tbmq-architecture', build: heroDc },
	'non-persistent-dev': { file: 'tbmq-non-persistent-dev', build: flows.nonPersistentDev },
	'non-persist-dev-cluster': { file: 'tbmq-non-persist-dev-cluster', build: flows.nonPersistDevCluster },
	'persistent-dev': { file: 'tbmq-persistent-dev', build: flows.persistentDev },
	'persist-dev-cluster': { file: 'tbmq-persist-dev-cluster', build: flows.persistDevCluster },
	app: { file: 'tbmq-app', build: flows.app },
	'app-cluster': { file: 'tbmq-app-cluster', build: flows.appCluster },
	'publish-lifecycle': { file: 'tbmq-publish-lifecycle', build: extras.publishLifecycle },
	'client-type-tree': { file: 'tbmq-client-type-decision', build: extras.clientTypeTree },
	'persistence-model': { file: 'tbmq-persistence-model', build: extras.persistenceModel },
	// The alternative (clean-room) version won this one outright — kept as the
	// live diagram as-is, so this entry builds `alt.subscriptionTrie` rather
	// than `extras.subscriptionTrie`.
	'subscription-trie': { file: 'tbmq-subscription-trie', build: alt.subscriptionTrie },
	'kafka-topics-map': { file: 'tbmq-kafka-topics', build: extras.kafkaTopicsMap },
	// Alternative version adopted as the live diagram (the committed SVGs already
	// match it) — build `alt.standaloneVsCluster`, not the `extras` one, or a
	// plain `pnpm diagrams:arch` silently reverts it.
	'standalone-vs-cluster': { file: 'tbmq-standalone-vs-cluster', build: alt.standaloneVsCluster },
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
