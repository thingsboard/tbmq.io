import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectFacts, collectPages, normaliseHref, sectionOf } from './collect.ts';

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
	assert.equal(normaliseHref('https://tbmq.io/community/'), '/community/');
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

test('collectFacts reports absent metadata as empty rather than throwing', () => {
	const facts = collectFacts('<!doctype html><html><head></head><body></body></html>', '/bare/');
	assert.equal(facts.title, '');
	assert.equal(facts.description, '');
	assert.equal(facts.canonical, null);
	assert.equal(facts.hasJsonLd, false);
	assert.equal(facts.h1Count, 0);
	assert.equal(facts.wordCount, 0);
	assert.deepEqual(facts.outboundPathnames, []);
});

test('collectFacts detects meta-refresh redirect stubs', () => {
	const html =
		'<!doctype html><html><head><meta http-equiv="refresh" content="0;url=/new/"></head><body></body></html>';
	assert.equal(collectFacts(html, '/old/').isRedirect, true);
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
	const dir = './scripts/lib/seo';
	assert.throws(
		() => collectPages(dir),
		(error: unknown) => error instanceof Error && /contains no pages/.test(error.message) && error.message.includes(dir)
	);
});
