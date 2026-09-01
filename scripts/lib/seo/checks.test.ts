import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkMetadata } from './checks.ts';
import type { PageFacts } from './types.ts';

/** A page that trips no check, so each test can vary exactly one field. */
function page(overrides: Partial<PageFacts> = {}): PageFacts {
	return {
		pathname: '/mqtt/qos/',
		section: 'mqtt',
		isRedirect: false,
		title: 'MQTT QoS 0, 1 and 2 Explained in Depth',
		description:
			'How each MQTT quality-of-service level behaves in practice, and which one to choose for a given IoT workload.',
		h1Count: 1,
		wordCount: 1200,
		hasJsonLd: true,
		canonical: 'https://tbmq.io/mqtt/qos/',
		outboundPathnames: ['/docs/getting-started/'],
		...overrides,
	};
}

const checkIds = (findings: { check: string }[]) => findings.map((f) => f.check).sort();

test('a clean page produces no findings', () => {
	assert.deepEqual(checkMetadata([page()]), []);
});

test('redirect stubs are skipped entirely', () => {
	assert.deepEqual(checkMetadata([page({ isRedirect: true, title: '', description: '', canonical: null })]), []);
});

test('missing title and description are high severity', () => {
	const findings = checkMetadata([page({ title: '', description: '' })]);
	assert.deepEqual(checkIds(findings), ['description-missing', 'title-missing']);
	assert.ok(findings.every((f) => f.severity === 'high'));
});

test('title length is bounded on both sides', () => {
	assert.deepEqual(checkIds(checkMetadata([page({ title: 'x'.repeat(61) })])), ['title-too-long']);
	assert.deepEqual(checkIds(checkMetadata([page({ title: 'x'.repeat(29) })])), ['title-too-short']);
	assert.deepEqual(checkMetadata([page({ title: 'x'.repeat(60) })]), []);
	assert.deepEqual(checkMetadata([page({ title: 'x'.repeat(30) })]), []);
});

test('description length is bounded on both sides', () => {
	assert.deepEqual(checkIds(checkMetadata([page({ description: 'x'.repeat(161) })])), ['description-too-long']);
	assert.deepEqual(checkIds(checkMetadata([page({ description: 'x'.repeat(69) })])), ['description-too-short']);
});

test('exactly one h1 is required', () => {
	assert.deepEqual(checkIds(checkMetadata([page({ h1Count: 0 })])), ['h1-count']);
	assert.deepEqual(checkIds(checkMetadata([page({ h1Count: 2 })])), ['h1-count']);
});

test('thin content is flagged below the word threshold', () => {
	assert.deepEqual(checkIds(checkMetadata([page({ wordCount: 299 })])), ['thin-content']);
	assert.deepEqual(checkMetadata([page({ wordCount: 300 })]), []);
});

test('a missing JSON-LD block is flagged', () => {
	assert.deepEqual(checkIds(checkMetadata([page({ hasJsonLd: false })])), ['jsonld-missing']);
});

test('canonical must be present and on the production origin', () => {
	assert.deepEqual(checkIds(checkMetadata([page({ canonical: null })])), ['canonical-missing']);
	assert.deepEqual(checkIds(checkMetadata([page({ canonical: 'https://example.com/qos/' })])), [
		'canonical-off-origin',
	]);
});

test('duplicate titles are reported once, site-wide, naming every page', () => {
	const findings = checkMetadata([
		page({ pathname: '/a/', title: 'Shared Title That Is Long Enough Here' }),
		page({ pathname: '/b/', title: 'Shared Title That Is Long Enough Here' }),
	]);
	const duplicates = findings.filter((f) => f.check === 'title-duplicate');
	assert.equal(duplicates.length, 1);
	assert.equal(duplicates[0].pathname, '');
	assert.match(duplicates[0].detail, /\/a\/.*\/b\//);
});

test('a unique title produces no duplicate finding', () => {
	const findings = checkMetadata([
		page({ pathname: '/a/' }),
		page({ pathname: '/b/', title: 'A Totally Different Title Here' }),
	]);
	assert.equal(findings.filter((f) => f.check === 'title-duplicate').length, 0);
});
