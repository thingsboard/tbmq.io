// Helpers for page-level JSON-LD structured data (schema.org).
//
// Every graph reuses the same Organization node (`#organization`) so the site
// reads as one publisher. Ratings are deliberately absent everywhere: a rich
// result that quotes them would need real review data behind it.

import { GITHUB_REPO_URL, OG_FALLBACK, ORGANIZATION_NODE, organizationJsonLd, PROD_ORIGIN, SITE_NAME } from '~/consts';
import { TBMQ_VER } from '~/data/versions';

const SITE = new URL(PROD_ORIGIN);

/** Absolute production URL of a site path — every `url`, `@id` and `item` below goes through it. */
function absolute(path: string): string {
	return new URL(path, SITE).href;
}

const ORGANIZATION_ID = absolute(ORGANIZATION_NODE);
const WEBSITE_ID = absolute('/#website');

/** A reference to a node defined elsewhere in the graph. */
function ref(id: string) {
	return { '@id': id };
}

function organization() {
	return organizationJsonLd(SITE);
}

function webSite() {
	return {
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		name: SITE_NAME,
		url: absolute('/'),
		publisher: ref(ORGANIZATION_ID),
	};
}

export interface Crumb {
	name: string;
	/** Absolute URL. Every crumb but the last must carry one for the rich result to validate. */
	item: string;
}

function breadcrumbList(url: string, crumbs: Crumb[]) {
	return {
		'@type': 'BreadcrumbList',
		'@id': `${url}#breadcrumb`,
		itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
	};
}

function webPage(url: string, name: string, description?: string) {
	return {
		'@type': 'WebPage',
		'@id': `${url}#webpage`,
		url,
		name,
		...(description ? { description } : {}),
		inLanguage: 'en-US',
	};
}

export interface MarketingJsonLdOptions {
	/** Page path with leading and trailing slash, e.g. '/performance/'. */
	path: string;
	/** Clean page name (without the ' | TBMQ' title suffix). */
	name: string;
	/** Page meta description (reuse the same string passed to BaseLayout). */
	description?: string;
	/** Breadcrumb leaf label, e.g. 'Performance'. */
	breadcrumb: string;
}

/**
 * Build a schema.org @graph (WebPage + BreadcrumbList) for a marketing page.
 * `BaseLayout` and `LegalLayout` build it from their `breadcrumb` prop; pass the
 * result to their `jsonLd` prop only for a page that needs a different graph.
 */
export function marketingJsonLd({
	path,
	name,
	description,
	breadcrumb,
}: MarketingJsonLdOptions): Record<string, unknown> {
	const url = absolute(path.endsWith('/') ? path : `${path}/`);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			webPage(url, name, description),
			breadcrumbList(url, [
				{ name: 'Home', item: absolute('/') },
				{ name: breadcrumb, item: url },
			]),
		],
	};
}

export interface HomeJsonLdOptions {
	description: string;
}

/**
 * Home page: the Organization, the WebSite and TBMQ itself as a free
 * SoftwareApplication, so search engines read the domain as a product site.
 */
export function homeJsonLd({ description }: HomeJsonLdOptions): Record<string, unknown> {
	const url = absolute('/');
	return {
		'@context': 'https://schema.org',
		'@graph': [
			organization(),
			webSite(),
			{
				'@type': 'SoftwareApplication',
				'@id': `${url}#software`,
				name: SITE_NAME,
				description,
				url,
				applicationCategory: 'DeveloperApplication',
				applicationSubCategory: 'MQTT broker',
				operatingSystem: 'Linux, macOS, Windows, Kubernetes',
				softwareVersion: TBMQ_VER,
				license: 'https://www.apache.org/licenses/LICENSE-2.0',
				downloadUrl: absolute('/installations/'),
				installUrl: absolute('/docs/installation/'),
				softwareHelp: { '@type': 'CreativeWork', url: absolute('/docs/') },
				sameAs: GITHUB_REPO_URL,
				author: ref(ORGANIZATION_ID),
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: absolute('/pricing/') },
			},
		],
	};
}

export interface PricingJsonLdOptions {
	/** Clean page name (without the ' | TBMQ' title suffix). */
	name: string;
	description: string;
	/** Number of plans the page presents — read it off the same data that renders them. */
	planCount: number;
}

/**
 * Pricing page: TBMQ as a Product with one AggregateOffer spanning the free
 * Community Edition and the paid plans. The paid plans are usage-priced, so
 * only the floor (0, the free edition) is stated as a number and the plans are
 * not listed as individual Offers — an Offer without a price fails validation.
 */
export function pricingJsonLd({ name, description, planCount }: PricingJsonLdOptions): Record<string, unknown> {
	const url = absolute('/pricing/');
	return {
		'@context': 'https://schema.org',
		'@graph': [
			webPage(url, name, description),
			breadcrumbList(url, [
				{ name: 'Home', item: absolute('/') },
				{ name: 'Pricing', item: url },
			]),
			{
				'@type': 'Product',
				'@id': `${url}#product`,
				name: SITE_NAME,
				description,
				image: absolute(OG_FALLBACK),
				brand: ref(ORGANIZATION_ID),
				offers: {
					'@type': 'AggregateOffer',
					url,
					priceCurrency: 'USD',
					lowPrice: '0',
					offerCount: planCount,
				},
			},
			organization(),
		],
	};
}

export interface DocsJsonLdOptions {
	/** Canonical absolute URL of the page. */
	url: string;
	headline: string;
	description?: string;
	/** Home → docs root → (existing section index pages) → this page. */
	crumbs: Crumb[];
}

/** Documentation page: a TechArticle plus the breadcrumb trail Starlight's sidebar implies. */
export function docsJsonLd({ url, headline, description, crumbs }: DocsJsonLdOptions): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'TechArticle',
				'@id': `${url}#article`,
				headline,
				...(description ? { description } : {}),
				url,
				mainEntityOfPage: url,
				inLanguage: 'en-US',
				isPartOf: ref(WEBSITE_ID),
				author: ref(ORGANIZATION_ID),
				publisher: ref(ORGANIZATION_ID),
			},
			breadcrumbList(url, crumbs),
			webSite(),
			organization(),
		],
	};
}
