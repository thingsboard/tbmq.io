import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installSections } from './installationsHub.ts';

// The hub's TBMQ chips and the cards of the docs installation index are two hand-kept lists of the
// same guides. Nothing else ties them together, so this compares them: a guide added to or dropped
// from one list fails here until the other follows.

const INDEX = new URL('../content/_includes/docs/mqtt-broker/installation/index.mdx', import.meta.url);

/** The guide paths of the index's `<InstallOptionGrid items>` cards, e.g. `installation/docker`. */
const indexGuides = () =>
	[...readFileSync(INDEX, 'utf8').matchAll(/\{\s*path:\s*'(installation\/[^']+)'/g)].map((m) => m[1]!).sort();

/** The same paths from the hub's chips: `/docs/pe/installation/docker/` → `installation/docker`. */
const hubGuides = () => {
	const tbmq = installSections.find((section) => section.id === 'tbmq');
	assert.ok(tbmq?.options, 'the hub has a TBMQ section with options');
	return tbmq.options
		.flatMap((group) => group.items)
		.map((item) => item.href.replace(/^\/docs\/(pe\/)?/, '').replace(/\/$/, ''))
		.sort();
};

test('the index lists guides for the comparison to mean something', () => {
	assert.ok(indexGuides().length >= 10, `found ${indexGuides().length}`);
});

test('the installations hub and the docs installation index name the same TBMQ guides', () => {
	assert.deepEqual(hubGuides(), indexGuides());
});

test('every TBMQ chip opens the Professional guide, except the Community-only one, which says so', () => {
	const tbmq = installSections.find((section) => section.id === 'tbmq');
	for (const item of tbmq!.options!.flatMap((group) => group.items)) {
		if (item.href.startsWith('/docs/pe/')) continue;
		assert.equal(item.href, '/docs/installation/building-from-source/');
		assert.equal(item.note, '(Community Edition)');
	}
});
