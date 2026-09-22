import test from 'node:test';
import assert from 'node:assert/strict';
import { PROD_ORIGIN } from '../consts.ts';
import {
	docsBreadcrumbs,
	docsJsonLd,
	homeJsonLd,
	marketingJsonLd,
	pricingJsonLd,
	type Crumb,
} from './structuredData.ts';

type Node = Record<string, unknown>;

function graph(jsonLd: Record<string, unknown>): Node[] {
	assert.equal(jsonLd['@context'], 'https://schema.org');
	return jsonLd['@graph'] as Node[];
}

function node(jsonLd: Record<string, unknown>, type: string): Node {
	const matches = graph(jsonLd).filter((n) => n['@type'] === type);
	assert.equal(matches.length, 1, `expected exactly one ${type} node`);
	return matches[0]!;
}

/** Every `@id`, `url` and breadcrumb `item` in every graph, flattened. */
function urls(jsonLd: Record<string, unknown>): string[] {
	const found: string[] = [];
	const walk = (value: unknown) => {
		if (Array.isArray(value)) return value.forEach(walk);
		if (value && typeof value === 'object') {
			for (const [key, child] of Object.entries(value)) {
				if (typeof child === 'string' && ['@id', 'url', 'item', 'mainEntityOfPage'].includes(key)) found.push(child);
				else walk(child);
			}
		}
	};
	walk(jsonLd);
	return found;
}

const crumb = (name: string, item: string): Crumb => ({ name, item });

// ---------------------------------------------------------------------------
// Origin
// ---------------------------------------------------------------------------

// Preview builds set Astro's `site` to CF_PAGES_URL. The graph must not follow
// it, or a preview deploy — the one place the graph can be validated before it
// ships — describes a different site than production does.
test('every url in every graph is anchored on the production origin', () => {
	const graphs = [
		docsJsonLd({ path: '/docs/pe/installation/', headline: 'Installation', crumbs: [] }),
		marketingJsonLd({ path: '/installations/', name: 'Installations', breadcrumb: 'Installations' }),
		homeJsonLd({ description: 'A description.' }),
		pricingJsonLd({ name: 'Pricing', description: 'A description.', planCount: 3 }),
	];
	for (const jsonLd of graphs) {
		const absolute = urls(jsonLd).filter((u) => u.startsWith('http'));
		assert.ok(absolute.length > 0);
		for (const url of absolute) {
			if (url.startsWith('https://www.apache.org/')) continue; // SoftwareApplication.license
			assert.ok(url === PROD_ORIGIN || url.startsWith(`${PROD_ORIGIN}/`), `${url} is not on ${PROD_ORIGIN}`);
		}
	}
});

// ---------------------------------------------------------------------------
// docsJsonLd
// ---------------------------------------------------------------------------

test('the TechArticle is built from the path it is given, not the page it renders on', () => {
	// routeData passes the canonical pathname, so a CE page carries the PE graph.
	const article = node(docsJsonLd({ path: '/docs/pe/qos/', headline: 'QoS', crumbs: [] }), 'TechArticle');
	assert.equal(article['@id'], `${PROD_ORIGIN}/docs/pe/qos/#article`);
	assert.equal(article['url'], `${PROD_ORIGIN}/docs/pe/qos/`);
	assert.equal(article['mainEntityOfPage'], `${PROD_ORIGIN}/docs/pe/qos/`);
	assert.equal(article['headline'], 'QoS');
});

test('the TechArticle refs the WebSite and Organization nodes its own graph defines', () => {
	const jsonLd = docsJsonLd({ path: '/docs/pe/qos/', headline: 'QoS', crumbs: [] });
	const article = node(jsonLd, 'TechArticle');
	const website = node(jsonLd, 'WebSite');
	const organization = node(jsonLd, 'Organization');
	assert.deepEqual(article['isPartOf'], { '@id': website['@id'] });
	assert.deepEqual(article['author'], { '@id': organization['@id'] });
	assert.deepEqual(article['publisher'], { '@id': organization['@id'] });
	assert.deepEqual(website['publisher'], { '@id': organization['@id'] });
});

test('a docs page without a description omits the key rather than emitting an empty one', () => {
	const withDesc = node(docsJsonLd({ path: '/docs/', headline: 'Docs', description: 'd', crumbs: [] }), 'TechArticle');
	const without = node(docsJsonLd({ path: '/docs/', headline: 'Docs', crumbs: [] }), 'TechArticle');
	assert.equal(withDesc['description'], 'd');
	assert.equal('description' in without, false);
});

test('breadcrumb items are numbered from 1 in the order they are given', () => {
	const jsonLd = docsJsonLd({
		path: '/docs/pe/installation/docker/',
		headline: 'Docker',
		crumbs: [crumb('Home', `${PROD_ORIGIN}/`), crumb('Docker', `${PROD_ORIGIN}/docs/pe/installation/docker/`)],
	});
	const breadcrumb = node(jsonLd, 'BreadcrumbList');
	assert.equal(breadcrumb['@id'], `${PROD_ORIGIN}/docs/pe/installation/docker/#breadcrumb`);
	assert.deepEqual(breadcrumb['itemListElement'], [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: `${PROD_ORIGIN}/` },
		{
			'@type': 'ListItem',
			position: 2,
			name: 'Docker',
			item: `${PROD_ORIGIN}/docs/pe/installation/docker/`,
		},
	]);
});

// ---------------------------------------------------------------------------
// docsBreadcrumbs
// ---------------------------------------------------------------------------

const TITLES = new Map([
	['/docs/installation/', 'Installation'],
	['/docs/pe/installation/', 'Installation'],
	['/docs/pe/installation/cluster/k8s/', 'Kubernetes'],
]);

test('the trail starts at Home and the docs root of the edition the path names', () => {
	const ce = docsBreadcrumbs('/docs/installation/', TITLES);
	assert.deepEqual(ce[0], crumb('Home', `${PROD_ORIGIN}/`));
	assert.deepEqual(ce[1], crumb('TBMQ Docs', `${PROD_ORIGIN}/docs/`));

	const pe = docsBreadcrumbs('/docs/pe/installation/', TITLES);
	assert.deepEqual(pe[1], crumb('TBMQ PE Docs', `${PROD_ORIGIN}/docs/pe/`));
});

test('the docs root itself gets no crumb beyond Home and the root', () => {
	assert.equal(docsBreadcrumbs('/docs/', TITLES).length, 2);
	assert.equal(docsBreadcrumbs('/docs/pe/', TITLES).length, 2);
});

// A crumb pointing at a 404 is worse than a shorter trail: `/docs/pe/installation/cluster/`
// has no page of its own, so the trail skips it and keeps the leaf.
test('a section with no page of its own is skipped, not named', () => {
	const trail = docsBreadcrumbs('/docs/pe/installation/cluster/k8s/', TITLES);
	assert.deepEqual(
		trail.map((c) => c.name),
		['Home', 'TBMQ PE Docs', 'Installation', 'Kubernetes']
	);
	assert.equal(
		trail.some((c) => c.item.endsWith('/cluster/')),
		false
	);
});

test('a page absent from the title map contributes no crumb of its own', () => {
	const trail = docsBreadcrumbs('/docs/pe/installation/unpublished/', TITLES);
	assert.deepEqual(
		trail.map((c) => c.name),
		['Home', 'TBMQ PE Docs', 'Installation']
	);
});

// The PE prefix is a path segment like any other; without the version-aware root
// the trail would name `pe` as a section of the CE tree.
test('the PE prefix never leaks into the trail as a section', () => {
	const trail = docsBreadcrumbs('/docs/pe/installation/', TITLES);
	assert.equal(
		trail.some((c) => c.name.toLowerCase() === 'pe'),
		false
	);
});

// ---------------------------------------------------------------------------
// marketingJsonLd
// ---------------------------------------------------------------------------

test('a marketing page gets a WebPage and a two-step trail under Home', () => {
	const jsonLd = marketingJsonLd({
		path: '/installations/',
		name: 'Installations',
		description: 'A description.',
		breadcrumb: 'Installations',
	});
	const page = node(jsonLd, 'WebPage');
	assert.equal(page['@id'], `${PROD_ORIGIN}/installations/#webpage`);
	assert.equal(page['name'], 'Installations');
	assert.equal(page['description'], 'A description.');
	assert.equal(page['inLanguage'], 'en-US');
	assert.deepEqual(node(jsonLd, 'BreadcrumbList')['itemListElement'], [
		{ '@type': 'ListItem', position: 1, name: 'Home', item: `${PROD_ORIGIN}/` },
		{ '@type': 'ListItem', position: 2, name: 'Installations', item: `${PROD_ORIGIN}/installations/` },
	]);
});

// `trailingSlash: 'always'`, so the @id must not depend on how the caller spelled it.
test('a marketing path without a trailing slash resolves to the same node ids', () => {
	const options = { name: 'Installations', breadcrumb: 'Installations' };
	assert.deepEqual(
		marketingJsonLd({ ...options, path: '/installations' }),
		marketingJsonLd({ ...options, path: '/installations/' })
	);
});

test('a marketing page without a description omits the key', () => {
	const page = node(marketingJsonLd({ path: '/contact-us/', name: 'Contact', breadcrumb: 'Contact' }), 'WebPage');
	assert.equal('description' in page, false);
});

// ---------------------------------------------------------------------------
// homeJsonLd / pricingJsonLd
// ---------------------------------------------------------------------------

test('the home page presents TBMQ as a free SoftwareApplication', () => {
	const jsonLd = homeJsonLd({ description: 'Open-source MQTT broker.' });
	const app = node(jsonLd, 'SoftwareApplication');
	assert.equal(app['@id'], `${PROD_ORIGIN}/#software`);
	assert.equal(app['description'], 'Open-source MQTT broker.');
	assert.deepEqual(app['offers'], {
		'@type': 'Offer',
		price: '0',
		priceCurrency: 'USD',
		url: `${PROD_ORIGIN}/pricing/`,
	});
	assert.deepEqual(app['author'], { '@id': node(jsonLd, 'Organization')['@id'] });
});

// The paid plans are usage-priced; an Offer without a price fails validation, so
// only the floor is stated and the plans are counted, not listed.
test('pricing states the free floor and the plan count, and no individual offers', () => {
	const jsonLd = pricingJsonLd({ name: 'Pricing', description: 'A description.', planCount: 4 });
	const product = node(jsonLd, 'Product');
	assert.deepEqual(product['offers'], {
		'@type': 'AggregateOffer',
		url: `${PROD_ORIGIN}/pricing/`,
		priceCurrency: 'USD',
		lowPrice: '0',
		offerCount: 4,
	});
	assert.equal(graph(jsonLd).filter((n) => n['@type'] === 'Offer').length, 0);
	assert.deepEqual(product['brand'], { '@id': node(jsonLd, 'Organization')['@id'] });
});
