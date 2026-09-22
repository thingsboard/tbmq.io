import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
	collectFacts,
	collectPages,
	normaliseHref,
	parseSitemapPathnames,
	readSitemapPathnames,
	sectionOf,
} from './collect.ts';

test('sectionOf classifies by path prefix', () => {
	assert.equal(sectionOf('/docs/getting-started/'), 'docs');
	assert.equal(sectionOf('/docs/pe/why-tbmq/'), 'docs');
	assert.equal(sectionOf('/mqtt/qos/'), 'mqtt');
	assert.equal(sectionOf('/pricing/'), 'other');
	assert.equal(sectionOf('/'), 'other');
});

test('normaliseHref rejects everything that is not a same-origin page', () => {
	assert.equal(normaliseHref(undefined), null);
	assert.equal(normaliseHref(''), null);
	assert.equal(normaliseHref('#top'), null);
	assert.equal(normaliseHref('mailto:hello@thingsboard.io'), null);
	assert.equal(normaliseHref('https://emqx.io/docs/'), null);
	assert.equal(normaliseHref('//cdn.example.com/asset'), null);
});

test('normaliseHref canonicalises same-origin pages', () => {
	assert.equal(normaliseHref('/docs/foo'), '/docs/foo/');
	assert.equal(normaliseHref('/docs/foo/'), '/docs/foo/');
	assert.equal(normaliseHref('/docs/foo/?utm=x#frag'), '/docs/foo/');
	assert.equal(normaliseHref('  /docs/foo  '), '/docs/foo/');
});

// Regression guard: a prototype that skipped this rewrite reported four false
// orphans, because parts of the build emit absolute same-origin hrefs.
test('normaliseHref rewrites absolute same-origin URLs to pathnames', () => {
	assert.equal(normaliseHref('https://tbmq.io/pricing/'), '/pricing/');
	assert.equal(normaliseHref('https://tbmq.io/docs/pe/why-tbmq/'), '/docs/pe/why-tbmq/');
	assert.equal(normaliseHref('https://tbmq.io'), '/');
});

test('normaliseHref leaves asset paths alone rather than slashing them', () => {
	assert.equal(normaliseHref('/images/logo.png'), '/images/logo.png');
	assert.equal(normaliseHref('/llms.txt'), '/llms.txt');
});

const PAGE = `<!doctype html><html><head>
	<title>MQTT QoS 0, 1 and 2 Explained</title>
	<meta name="description" content="How each MQTT quality-of-service level behaves.">
	<link rel="canonical" href="https://tbmq.io/mqtt/qos/">
	<script type="application/ld+json">{"@type":"Article"}</script>
</head><body><main>
	<h1>MQTT QoS</h1>
	<p>one two three four five</p>
	<a href="/docs/getting-started/">docs</a>
	<a href="https://tbmq.io/mqtt/topics/">topics</a>
	<a href="/mqtt/qos/">self</a>
	<a href="https://emqx.io/">external</a>
</main></body></html>`;

test('collectFacts extracts head metadata', () => {
	const facts = collectFacts(PAGE, '/mqtt/qos/');
	assert.equal(facts.pathname, '/mqtt/qos/');
	assert.equal(facts.section, 'mqtt');
	assert.equal(facts.isRedirect, false);
	assert.equal(facts.title, 'MQTT QoS 0, 1 and 2 Explained');
	assert.equal(facts.description, 'How each MQTT quality-of-service level behaves.');
	assert.equal(facts.canonical, 'https://tbmq.io/mqtt/qos/');
	assert.equal(facts.hasJsonLd, true);
	assert.equal(facts.h1Count, 1);
});

test('collectFacts counts words in main content', () => {
	assert.equal(collectFacts(PAGE, '/mqtt/qos/').wordCount, 11);
});

test('collectFacts collects unique outbound pages, excluding self and externals', () => {
	const facts = collectFacts(PAGE, '/mqtt/qos/');
	assert.deepEqual(facts.outboundPathnames.sort(), ['/docs/getting-started/', '/mqtt/topics/']);
});

const CHROME_PAGE = `<!doctype html><html><head><title>t</title></head><body>
	<header><a href="/pricing/">pricing</a><a href="/docs/getting-started/">docs</a></header>
	<nav class="sidebar"><a href="/mqtt/">learn</a></nav>
	<main><h1>Title</h1><a href="/mqtt/topics/">topics in body copy</a></main>
	<footer><a href="/company/">company</a></footer>
</body></html>`;

// Site chrome links to the same pages from every page, so the two crosslink checks
// need a link set that excludes it; inbound counting needs one that includes it.
test('collectFacts separates main-content links from chrome links', () => {
	const facts = collectFacts(CHROME_PAGE, '/mqtt/qos/');
	assert.deepEqual(facts.outboundPathnames.sort(), [
		'/company/',
		'/docs/getting-started/',
		'/mqtt/',
		'/mqtt/topics/',
		'/pricing/',
	]);
	assert.deepEqual(facts.mainOutboundPathnames, ['/mqtt/topics/']);
});

// Seven built pages (all marketing) have no `<main>` at all, so the fallback is
// what they are measured by — the same fallback `wordCount` already uses.
test('collectFacts falls back to body when a page has no main element', () => {
	const html = '<!doctype html><html><head><title>t</title></head><body><a href="/docs/x/">x</a></body></html>';
	assert.deepEqual(collectFacts(html, '/no-main/').mainOutboundPathnames, ['/docs/x/']);
});

test('collectFacts reports absent metadata as empty rather than throwing', () => {
	const facts = collectFacts('<!doctype html><html><head></head><body></body></html>', '/bare/');
	assert.equal(facts.title, '');
	assert.equal(facts.description, '');
	assert.equal(facts.canonical, null);
	assert.equal(facts.hasJsonLd, false);
	assert.equal(facts.h1Count, 0);
	assert.equal(facts.wordCount, 0);
	assert.deepEqual(facts.outboundPathnames, []);
	assert.deepEqual(facts.mainOutboundPathnames, []);
});

test('collectFacts detects meta-refresh redirect stubs', () => {
	const html =
		'<!doctype html><html><head><meta http-equiv="refresh" content="0;url=/new/"></head><body></body></html>';
	assert.equal(collectFacts(html, '/old/').isRedirect, true);
});

test('collectFacts reads noindex from the robots meta', () => {
	const withRobots = (content: string) =>
		`<!doctype html><html><head><meta name="robots" content="${content}"></head><body></body></html>`;
	assert.equal(collectFacts(withRobots('noindex, follow'), '/x/').isNoindex, true);
	assert.equal(collectFacts(withRobots('NOINDEX'), '/x/').isNoindex, true);
	assert.equal(collectFacts(withRobots('index, follow'), '/x/').isNoindex, false);
	assert.equal(collectFacts(PAGE, '/mqtt/qos/').isNoindex, false);
});

test('collectFacts treats a robots meta without content as not noindex', () => {
	const html = '<!doctype html><html><head><meta name="robots"></head><body></body></html>';
	assert.equal(collectFacts(html, '/x/').isNoindex, false);
});

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://tbmq.io/</loc><lastmod>2026-08-27T12:12:43.000Z</lastmod></url><url><loc>https://tbmq.io/docs/pe/qos/</loc></url><url><loc>
	https://tbmq.io/mqtt/qos
</loc></url></urlset>`;

test('parseSitemapPathnames returns a normalised pathname for every loc, in file order', () => {
	assert.deepEqual(parseSitemapPathnames(SITEMAP), ['/', '/docs/pe/qos/', '/mqtt/qos/']);
});

test('parseSitemapPathnames also resolves the sitemap files an index points at', () => {
	const index = '<sitemapindex><sitemap><loc>https://tbmq.io/sitemap-0.xml</loc></sitemap></sitemapindex>';
	assert.deepEqual(parseSitemapPathnames(index), ['/sitemap-0.xml']);
});

// A build made with PUBLIC_SITE_URL / CF_PAGES_URL set writes that origin into
// every <loc>. Dropping those would empty the set and flag every page as
// `sitemap-missing` — the sitemap lists pages of exactly one site, so only the
// pathname carries information.
test('parseSitemapPathnames reads the pathname whatever origin the build wrote', () => {
	const xml = '<urlset><url><loc>https://preview.tbmq-io.pages.dev/docs/pe/qos/</loc></url></urlset>';
	assert.deepEqual(parseSitemapPathnames(xml), ['/docs/pe/qos/']);
});

/** A three-page build with a two-file sitemap on a preview origin; see the files for what each page is. */
const FIXTURE_SITE = './scripts/lib/seo/fixtures/site';

test('readSitemapPathnames unions every sitemap file the index points at', () => {
	assert.deepEqual([...readSitemapPathnames(FIXTURE_SITE)].sort(), ['/', '/docs/pe/qos/']);
});

// The orphan-page tasks all hinge on "in the sitemap, yet…", so a missing or
// empty sitemap must fail loudly rather than mark every page `sitemap-missing`.
test('readSitemapPathnames throws when the build has no sitemap index', () => {
	assert.throws(() => readSitemapPathnames(emptyDir()), /no sitemap-index\.xml/);
});

test('readSitemapPathnames throws when the sitemap lists no pages', () => {
	assert.throws(() => readSitemapPathnames('./scripts/lib/seo/fixtures/empty-sitemap'), /lists no pages/);
});

test('collectPages reads every page in the build and stamps whether the sitemap lists it', () => {
	const pages = new Map(collectPages(FIXTURE_SITE).map((page) => [page.pathname, page]));
	assert.deepEqual([...pages.keys()].sort(), ['/', '/docs/pe/qos/', '/docs/qos/']);
	assert.equal(pages.get('/')!.inSitemap, true);
	assert.equal(pages.get('/docs/pe/qos/')!.inSitemap, true);
	assert.equal(pages.get('/docs/qos/')!.inSitemap, false, 'canonicalised onto PE, so correctly absent');
	assert.equal(pages.get('/docs/pe/qos/')!.title, 'Quality of Service Levels in TBMQ | TBMQ PE Docs');
	assert.deepEqual(pages.get('/')!.outboundPathnames, ['/docs/pe/qos/']);
});

// A missing build output must be a loud error, not a silent "0 pages, no
// issues found" — that reads as good news to an unattended weekly diff.
test('collectPages throws when the build output directory does not exist', () => {
	const dir = './scripts/lib/seo/does-not-exist';
	assert.throws(
		() => collectPages(dir),
		(error: unknown) =>
			error instanceof Error && /no build output at/.test(error.message) && error.message.includes(dir)
	);
});

// A directory that exists but enumerates zero pages (an emptied dist/, or a
// typo that still resolves to a real path) is a different mistake and gets
// a distinct message naming the directory.
test('collectPages throws when the build output directory has no pages', () => {
	const dir = emptyDir();
	assert.throws(
		() => collectPages(dir),
		(error: unknown) => error instanceof Error && /contains no pages/.test(error.message) && error.message.includes(dir)
	);
});

function emptyDir(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'seo-audit-empty-'));
}
