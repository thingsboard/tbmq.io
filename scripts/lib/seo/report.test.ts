import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatText, resolveDistDir, summarise, toJson } from './report.ts';
import type { AuditReport, Finding, PageFacts } from './types.ts';

function report(findings: Finding[]): AuditReport {
	return {
		generatedFor: './dist',
		pageCount: 3,
		sectionCounts: { docs: 1, mqtt: 1, other: 1 },
		skipped: { noindex: 0, redirect: 0 },
		findings,
	};
}

const low = (pathname: string): Finding => ({ check: 'thin-content', severity: 'low', pathname, detail: '10 words' });

/** Only the fields the census reads vary; everything else is a valid placeholder. */
function page(overrides: Partial<PageFacts>): PageFacts {
	return {
		pathname: '/x/',
		section: 'other',
		isRedirect: false,
		isNoindex: false,
		inSitemap: true,
		title: 't',
		description: 'd',
		h1Count: 1,
		wordCount: 0,
		hasJsonLd: false,
		canonical: null,
		outboundPathnames: [],
		mainOutboundPathnames: [],
		...overrides,
	};
}

test('summarise counts indexable pages by section and reports the rest as skipped', () => {
	const summary = summarise([
		page({ pathname: '/docs/a/', section: 'docs' }),
		page({ pathname: '/docs/b/', section: 'docs' }),
		page({ pathname: '/mqtt/c/', section: 'mqtt' }),
		page({ pathname: '/docs/search/', section: 'docs', isNoindex: true }),
		page({ pathname: '/old/', isRedirect: true }),
	]);
	assert.equal(summary.pageCount, 3);
	assert.deepEqual(summary.sectionCounts, { docs: 2, mqtt: 1 });
	assert.deepEqual(summary.skipped, { noindex: 1, redirect: 1 });
});

// A redirect stub that also says noindex is one skipped page, not two.
test('summarise counts a noindex redirect stub once, as a redirect', () => {
	const summary = summarise([page({ pathname: '/gone/', isRedirect: true, isNoindex: true })]);
	assert.equal(summary.pageCount, 0);
	assert.deepEqual(summary.sectionCounts, {});
	assert.deepEqual(summary.skipped, { noindex: 0, redirect: 1 });
});

test('formatText reports the page census', () => {
	const text = formatText(report([]));
	assert.match(text, /3 pages/);
	assert.match(text, /docs=1/);
	assert.match(text, /mqtt=1/);
});

test('formatText reports how many noindex and redirect pages were skipped', () => {
	const text = formatText({ ...report([]), skipped: { noindex: 5, redirect: 1 } });
	assert.match(text, /skipped 5 noindex \+ 1 redirect/);
	assert.ok(!formatText(report([])).includes('skipped'), 'nothing to say when nothing was skipped');
});

test('formatText says so explicitly when there are no findings', () => {
	assert.match(formatText(report([])), /no issues found/i);
});

test('formatText groups findings by check with a count', () => {
	const text = formatText(report([low('/a/'), low('/b/')]));
	assert.match(text, /thin-content.*\b2\b/);
});

test('formatText orders high severity before low', () => {
	const text = formatText(
		report([low('/a/'), { check: 'canonical-missing', severity: 'high', pathname: '/b/', detail: 'none' }])
	);
	assert.ok(text.indexOf('canonical-missing') < text.indexOf('thin-content'));
});

test('formatText caps examples at ten and says how many were withheld', () => {
	const text = formatText(report(Array.from({ length: 14 }, (_, i) => low(`/p${i}/`))));
	assert.match(text, /and 4 more/);
	assert.ok(!text.includes('/p12/'), 'the 13th example must not be listed');
});

test('toJson is stable across calls and carries no timestamp', () => {
	const one = toJson(report([low('/a/')]));
	const two = toJson(report([low('/a/')]));
	assert.equal(one, two);
	assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(one), 'an ISO timestamp would break week-over-week diffing');
	assert.deepEqual(JSON.parse(one).findings, [low('/a/')]);
});

test('resolveDistDir defaults to ./dist when the flag is absent', () => {
	assert.equal(resolveDistDir([]), './dist');
	assert.equal(resolveDistDir(['--json']), './dist');
});

test('resolveDistDir uses the given value', () => {
	assert.equal(resolveDistDir(['--dist=./other']), './other');
});

test('resolveDistDir treats an empty value as absent', () => {
	assert.equal(resolveDistDir(['--dist=']), './dist');
});

test('resolveDistDir rejects a bare --dist with no value', () => {
	assert.throws(() => resolveDistDir(['--dist']), /--dist requires a value/);
});
