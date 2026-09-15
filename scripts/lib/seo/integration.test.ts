import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fg from 'fast-glob';
import { buildReport, toJson } from './report.ts';
import { mqttTopics } from '../../../src/data/mqttLearn.ts';
import { BLOG_AUTHORS } from '../../../src/data/blog/authors.ts';

const DIST = './dist';

/**
 * Newest mtime among the sources a build reads. Every assertion here describes
 * the *current* tree, so a `dist/` older than the sources can only produce
 * failures about content that has since changed — skip instead, and say why.
 */
function newestSourceMtime(): number {
	const entries = fg.sync(['src/**/*', 'config/**/*', 'astro.*.ts', 'package.json'], { stats: true, dot: false });
	return entries.reduce((newest, entry) => Math.max(newest, entry.stats?.mtimeMs ?? 0), 0);
}

function skipReason(): string | false {
	if (!fs.existsSync(`${DIST}/index.html`)) return 'no dist/ — run pnpm build:linkcheck first';
	if (fs.statSync(`${DIST}/index.html`).mtimeMs < newestSourceMtime()) {
		return 'dist/ is older than the sources — rebuild with pnpm build:linkcheck';
	}
	return false;
}

const options = { skip: skipReason() };

/**
 * Every page the site publishes with `noindex`. They are counted as skipped
 * rather than audited, and they are the only indexable-page exceptions the
 * assertions below allow for. `/404/` is not in the list because Astro emits it
 * as `404.html`, which the page enumeration (a `**\/index.html` glob) never sees.
 */
const NOINDEX_PATHNAMES = [
	'/contact-us-thanks/',
	'/docs/newsletter-thanks/',
	'/docs/search/',
	'/docs/pe/search/',
	// One archive per registered author, each a thin re-listing of posts the blog
	// index already shows. Derived, so adding an author does not fail the census.
	...BLOG_AUTHORS.map((author) => `/blog/author/${author.slug}/`),
];

/** The docs tree is authored one file per route, so the content files are the census. */
const docsContentFiles = fg.sync('**/*.mdx', { cwd: 'src/content/docs/docs' }).length;

// These assertions state what the site is meant to look like rather than what it
// measured on one day, so a failure names a real defect instead of a stale number.
// The two counted sections are derived from the sources that generate them; the
// `other` section (marketing pages plus the blog) is not pinned, because posts
// are added and removed without anything being wrong.

test('every docs content file produced an indexable page, bar the noindex ones', options, () => {
	const report = buildReport(DIST);
	const noindexDocs = NOINDEX_PATHNAMES.filter((pathname) => pathname.startsWith('/docs/')).length;
	assert.equal(report.sectionCounts.docs, docsContentFiles - noindexDocs);
	assert.equal(report.skipped.noindex, NOINDEX_PATHNAMES.length);
});

test('the learn hub renders one page per registered topic, plus its index', options, () => {
	assert.equal(buildReport(DIST).sectionCounts.mqtt, mqttTopics.length + 1);
});

test('the page count is the sum of the section census', options, () => {
	const report = buildReport(DIST);
	const summed = Object.values(report.sectionCounts).reduce((total, count) => total + count, 0);
	assert.equal(report.pageCount, summed);
	assert.ok(report.sectionCounts.other > 0, 'the marketing pages and the blog are their own section');
});

// The docs graph is injected by the route middleware, the marketing one by the
// `breadcrumb` prop on BaseLayout / LegalLayout, so no indexable page is left out.
test('every indexable page carries structured data', options, () => {
	const missing = buildReport(DIST).findings.filter((f) => f.check === 'jsonld-missing');
	assert.deepEqual(
		missing.map((f) => f.pathname),
		[]
	);
});

// `/contact-us-thanks/` was the one page without an h1; it left the audited set
// when the collector started reading the robots meta.
test('every audited page has exactly one h1', options, () => {
	const findings = buildReport(DIST).findings.filter((f) => f.check === 'h1-count');
	assert.deepEqual(
		findings.map((f) => f.pathname),
		[]
	);
});

// The three inherited orphans are gone: two pages went noindex (backlog P0) and
// `/product/terms-of-use/` is now linked from both footers (task 11).
test('no indexable page is orphaned', options, () => {
	const orphans = buildReport(DIST).findings.filter((f) => f.check === 'orphan-page');
	assert.deepEqual(
		orphans.map((f) => f.pathname),
		[]
	);
});

// Both footers link all three legal pages from every page on the site, so none of
// them can be down to a single inbound link any more.
test('the legal pages are no longer near-orphans', options, () => {
	const nearOrphans = buildReport(DIST)
		.findings.filter((f) => f.check === 'near-orphan-page')
		.map((f) => f.pathname);
	for (const pathname of ['/product/privacy-policy/', '/product/terms-of-use/', '/cookie-policy/']) {
		assert.ok(!nearOrphans.includes(pathname), `${pathname} is linked from both footers`);
	}
});

// Both checks read main-content links only: site chrome links into both trees from
// every page, which made them structurally incapable of firing when they were
// measured against the whole-document link set.
test('the learn hub and the docs cross-link each other', options, () => {
	const findings = buildReport(DIST).findings;
	assert.deepEqual(
		findings.filter((f) => f.check === 'no-crosslink-to-docs').map((f) => f.pathname),
		[],
		'the hub index carries the "From protocol to broker" strip; every topic page links the docs'
	);
	const noLearnLink = findings.filter((f) => f.check === 'no-crosslink-to-learn').map((f) => f.pathname);
	// The pages whose shared include gained a `LearnLink` (task 09), one CE/PE pair each.
	for (const pathname of [
		'/docs/user-guide/qos/',
		'/docs/pe/user-guide/qos/',
		'/docs/user-guide/mqtt-over-ws/',
		'/docs/pe/user-guide/mqtt-over-ws/',
		'/docs/security/authentication/scram/',
		'/docs/pe/security/authentication/scram/',
	]) {
		assert.ok(!noLearnLink.includes(pathname), `${pathname} links into the learn hub`);
	}
});

// The sitemap must list exactly the indexable, self-canonical pages: a noindex page
// or redirect stub in it contradicts itself, and an indexable page left out is
// invisible to a crawler that starts there.
test('the sitemap lists exactly the indexable, self-canonical pages', options, () => {
	const findings = buildReport(DIST).findings;
	for (const check of ['sitemap-noindex', 'sitemap-non-canonical', 'sitemap-missing']) {
		assert.deepEqual(
			findings.filter((f) => f.check === check).map((f) => f.pathname),
			[],
			check
		);
	}
});

test('the audit is deterministic across runs', options, () => {
	assert.equal(toJson(buildReport(DIST)), toJson(buildReport(DIST)));
});

test('no page in the build fails to parse', options, () => {
	assert.doesNotThrow(() => buildReport(DIST));
});
