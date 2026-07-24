#!/usr/bin/env node
// Computes per-topic reading time for the /mqtt/ learn hub from the *rendered*
// pages and writes `readingMinutes` back into src/data/mqttLearn.ts.
//
// Usage: build the site first (so dist/ exists), then run this:
//   pnpm build:fast && node scripts/mqtt-reading-time.mjs
//
// Reading time = round(words / WPM), min 1. Word count is taken from the main
// article region only (hero title, quick answer, body, FAQ, How-TBMQ), with
// chrome (nav, side rail, CTA, scripts/styles/svg) stripped so it reflects the
// guide itself rather than boilerplate shared by every page.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WPM = 200;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = join(root, 'src/data/mqttLearn.ts');
const distDir = join(root, 'dist');

const registry = readFileSync(registryPath, 'utf8');
const slugs = [...registry.matchAll(/\bslug: '([^']+)'/g)].map((m) => m[1]);

function wordsFor(slug) {
	const file = join(distDir, 'mqtt', slug, 'index.html');
	if (!existsSync(file)) throw new Error(`Missing build output: ${file} — run a build first.`);
	let html = readFileSync(file, 'utf8');

	const main = html.match(/<main[^>]*class="[^"]*learn-page[^"]*"[^>]*>([\s\S]*?)<\/main>/i);
	let text = main ? main[1] : html;

	// Drop non-prose chrome before counting.
	text = text
		.replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, ' ')
		.replace(/<aside[\s\S]*?<\/aside>/gi, ' ') // side TOC + series nav
		.replace(/<nav[\s\S]*?<\/nav>/gi, ' ') // breadcrumb
		.replace(/<section[^>]*class="[^"]*learn-cta[^"]*"[\s\S]*?<\/section>/gi, ' ') // bottom CTA
		.replace(/<[^>]+>/g, ' ')
		.replace(/&[a-z]+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	return text ? text.split(' ').length : 0;
}

const minutesBySlug = {};
for (const slug of slugs) {
	const words = wordsFor(slug);
	minutesBySlug[slug] = Math.max(1, Math.round(words / WPM));
}

// Rewrite the registry: replace an existing readingMinutes line, else insert one
// right after each topic's slug line (indentation-agnostic).
let out = registry.replace(/\n\t+readingMinutes: \d+,/g, '');
out = out.replace(/(\n(\t+)slug: '([^']+)',)/g, (full, line, indent, slug) => {
	const m = minutesBySlug[slug];
	return m ? `${line}\n${indent}readingMinutes: ${m},` : full;
});

writeFileSync(registryPath, out, 'utf8');

const rows = Object.entries(minutesBySlug).sort((a, b) => b[1] - a[1]);
console.log(`Updated readingMinutes for ${rows.length} topics:`);
for (const [slug, m] of rows) console.log(`  ${String(m).padStart(2)} min  ${slug}`);
