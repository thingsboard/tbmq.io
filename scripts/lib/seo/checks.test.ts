import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLinkGraph, checkMetadata, runChecks } from './checks.ts';
import type { PageFacts } from './types.ts';

/**
 * A page that trips no check, so each test can vary exactly one field.
 * `mainOutboundPathnames` defaults to `outboundPathnames` unless overridden, so a
 * test that sets only the full link set still gets a page whose main content is a
 * subset of it — the invariant real pages have.
 */
function page(overrides: Partial<PageFacts> = {}): PageFacts {
	const facts: PageFacts = {
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
		mainOutboundPathnames: ['/docs/getting-started/'],
		...overrides,
	};
	return overrides.mainOutboundPathnames ? facts : { ...facts, mainOutboundPathnames: facts.outboundPathnames };
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

test('a page with no inbound internal link is an orphan', () => {
	const findings = checkLinkGraph([
		page({ pathname: '/a/', outboundPathnames: [] }),
		page({ pathname: '/b/', outboundPathnames: [] }),
	]);
	assert.deepEqual(
		findings
			.filter((f) => f.check === 'orphan-page')
			.map((f) => f.pathname)
			.sort(),
		['/a/', '/b/']
	);
});

test('a page with exactly one inbound link is a near-orphan, not an orphan', () => {
	const findings = checkLinkGraph([
		page({ pathname: '/a/', outboundPathnames: ['/b/'] }),
		page({ pathname: '/b/', outboundPathnames: [] }),
	]);
	assert.equal(findings.filter((f) => f.check === 'orphan-page' && f.pathname === '/b/').length, 0);
	assert.equal(findings.filter((f) => f.check === 'near-orphan-page' && f.pathname === '/b/').length, 1);
});

test('outbound links to pages outside the build do not create inbound counts', () => {
	const findings = checkLinkGraph([page({ pathname: '/a/', outboundPathnames: ['/does-not-exist/'] })]);
	assert.deepEqual(
		findings.filter((f) => f.check === 'orphan-page').map((f) => f.pathname),
		['/a/']
	);
});

test('redirect stubs are excluded from the link graph', () => {
	const findings = checkLinkGraph([
		page({ pathname: '/a/', outboundPathnames: ['/b/'] }),
		page({ pathname: '/b/', isRedirect: true, outboundPathnames: [] }),
	]);
	assert.equal(findings.filter((f) => f.pathname === '/b/').length, 0);
});

test('a learn-hub page that links to no docs page is flagged', () => {
	const findings = checkLinkGraph([
		page({ pathname: '/mqtt/qos/', section: 'mqtt', mainOutboundPathnames: ['/mqtt/topics/'] }),
	]);
	assert.equal(findings.filter((f) => f.check === 'no-crosslink-to-docs').length, 1);
});

test('a learn-hub page that links into docs is not flagged', () => {
	const findings = checkLinkGraph([
		page({ pathname: '/mqtt/qos/', section: 'mqtt', mainOutboundPathnames: ['/docs/getting-started/'] }),
	]);
	assert.equal(findings.filter((f) => f.check === 'no-crosslink-to-docs').length, 0);
});

test('a docs page that links to no learn-hub page is flagged at low severity', () => {
	const findings = checkLinkGraph([
		page({ pathname: '/docs/getting-started/', section: 'docs', mainOutboundPathnames: ['/docs/install/'] }),
	]);
	const crosslink = findings.filter((f) => f.check === 'no-crosslink-to-learn');
	assert.equal(crosslink.length, 1);
	assert.equal(crosslink[0].severity, 'low');
});

// Regression guard for the defect these two checks shipped with: they read the
// whole-document link set, which site chrome populates identically on every page,
// so both were structurally incapable of firing. Measured against dist/ on
// 2026-09-01, the minimum whole-document `/mqtt/` link count across all 183 docs
// pages was 6 — the header/footer set — so `no-crosslink-to-learn` was a
// permanent 0 that read as "every docs page cross-links".
test('crosslink checks ignore chrome links and read main content only', () => {
	const docsPage = page({
		pathname: '/docs/getting-started/',
		section: 'docs',
		outboundPathnames: ['/docs/install/', '/mqtt/qos/'],
		mainOutboundPathnames: ['/docs/install/'],
	});
	const learnPage = page({
		pathname: '/mqtt/qos/',
		section: 'mqtt',
		outboundPathnames: ['/mqtt/topics/', '/docs/getting-started/'],
		mainOutboundPathnames: ['/mqtt/topics/'],
	});
	const findings = checkLinkGraph([docsPage, learnPage]);
	assert.equal(
		findings.filter((f) => f.check === 'no-crosslink-to-learn' && f.pathname === '/docs/getting-started/').length,
		1
	);
	assert.equal(findings.filter((f) => f.check === 'no-crosslink-to-docs' && f.pathname === '/mqtt/qos/').length, 1);
});

// The mirror of the guard above: inbound counting must keep using the full link
// set, so a page reachable only from the footer is not reported as an orphan.
test('inbound counting still uses chrome links', () => {
	const findings = checkLinkGraph([
		page({ pathname: '/a/', section: 'other', outboundPathnames: ['/b/'], mainOutboundPathnames: [] }),
		page({ pathname: '/b/', section: 'other', outboundPathnames: [], mainOutboundPathnames: [] }),
	]);
	assert.equal(findings.filter((f) => f.check === 'orphan-page' && f.pathname === '/b/').length, 0);
	assert.equal(findings.filter((f) => f.check === 'near-orphan-page' && f.pathname === '/b/').length, 1);
});

test('runChecks merges both check families and sorts deterministically', () => {
	const pages = [
		page({ pathname: '/b/', title: '', outboundPathnames: [] }),
		page({ pathname: '/a/', outboundPathnames: ['/b/'] }),
	];
	const first = runChecks(pages);
	const second = runChecks([...pages].reverse());
	assert.deepEqual(first, second, 'findings must not depend on input order');
	const keys = first.map((f) => `${f.check} ${f.pathname}`);
	assert.deepEqual(keys, [...keys].sort(), 'findings must be sorted by (check, pathname)');
});

test('self-links do not count as inbound links', () => {
	const findings = checkLinkGraph([page({ pathname: '/a/', outboundPathnames: ['/a/'] })]);
	assert.equal(findings.filter((f) => f.check === 'orphan-page' && f.pathname === '/a/').length, 1);
	assert.equal(findings.filter((f) => f.check === 'near-orphan-page' && f.pathname === '/a/').length, 0);
});
