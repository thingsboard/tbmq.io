import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildReport, toJson } from './report.ts';

const DIST = './dist';
const hasBuild = fs.existsSync(`${DIST}/index.html`);
const options = { skip: hasBuild ? false : 'no dist/ — run pnpm build:linkcheck first' };

// Baseline measured 2026-09-01 against dist/. Content changes will move these;
// update them deliberately rather than loosening the assertions.
test('the audit reproduces the measured page census', options, () => {
	const report = buildReport(DIST);
	assert.equal(report.pageCount, 230);
	assert.deepEqual(report.sectionCounts, { docs: 183, mqtt: 35, other: 12 });
});

test('every /mqtt page carries JSON-LD and no /docs page does', options, () => {
	const missing = buildReport(DIST).findings.filter((f) => f.check === 'jsonld-missing');
	assert.equal(missing.filter((f) => f.pathname.startsWith('/mqtt/')).length, 0);
	assert.equal(missing.filter((f) => f.pathname.startsWith('/docs/')).length, 183);
});

test('exactly one page is missing an h1', options, () => {
	const h1 = buildReport(DIST).findings.filter((f) => f.check === 'h1-count');
	assert.deepEqual(
		h1.map((f) => f.pathname),
		['/contact-us-thanks/']
	);
});

// Measured against dist/ on 2026-09-01. `/community/` is a TRUE orphan: the only
// `https://tbmq.io/community/` href in the entire build sits on /community/ itself,
// so it has zero inbound links from any other page. This one assertion exercises
// both the absolute-href normalisation from Task 1 (without it the href is invisible
// and the count is trivially zero for the wrong reason) and the self-link guard from
// Task 3 (without it that href counts and downgrades this to near-orphan).
test('the orphan and near-orphan sets match the measured baseline', options, () => {
	const findings = buildReport(DIST).findings;
	const paths = (check: string) =>
		findings
			.filter((f) => f.check === check)
			.map((f) => f.pathname)
			.sort();
	assert.deepEqual(paths('orphan-page'), [
		'/community/',
		'/contact-us-thanks/',
		'/docs/newsletter-thanks/',
		'/product/terms-of-use/',
	]);
	assert.deepEqual(paths('near-orphan-page'), ['/docs/pe/search/', '/docs/search/', '/product/privacy-policy/']);
});

test('the audit is deterministic across runs', options, () => {
	assert.equal(toJson(buildReport(DIST)), toJson(buildReport(DIST)));
});

test('no page in the build fails to parse', options, () => {
	assert.doesNotThrow(() => buildReport(DIST));
});
