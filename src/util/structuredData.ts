// Helpers for page-level JSON-LD structured data (schema.org).
//
// Every graph reuses the same Organization node (`#organization`) so the site
// reads as one publisher. Ratings are deliberately absent everywhere: a rich
// result that quotes them would need real review data behind it.

import { OG_FALLBACK, organizationJsonLd, PROD_ORIGIN, SITE_NAME } from '~/consts';
import { TBMQ_VER } from '~/data/versions';

const SITE = new URL(PROD_ORIGIN);
const GITHUB_REPO = 'https://github.com/thingsboard/tbmq';

function organization() {
	return { ...organizationJsonLd(SITE), sameAs: [GITHUB_REPO, 'https://x.com/thingsboard'] };
}

function webSite() {
	return {
		'@type': 'WebSite',
		'@id': `${PROD_ORIGIN}/#website`,
		name: SITE_NAME,
		url: `${PROD_ORIGIN}/`,
		publisher: { '@id': `${PROD_ORIGIN}/#organization` },
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

export interface MarketingJsonLdOptions {
	/** Page path with leading and trailing slash, e.g. '/performance/'. */
	path: string;
	/** Clean page name (without the ' | TBMQ' title suffix). */
	name: string;
	/** Page meta description (reuse the same string passed to BaseLayout). */
	description: string;
	/** Breadcrumb leaf label, e.g. 'Performance'. */
	breadcrumb: string;
}

/**
 * Build a schema.org @graph (WebPage + BreadcrumbList) for a marketing page.
 * Pass the result to BaseLayout's `jsonLd` prop.
 */
export function marketingJsonLd({
	path,
	name,
	description,
	breadcrumb,
}: MarketingJsonLdOptions): Record<string, unknown> {
	const url = `${PROD_ORIGIN}${path}`;
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebPage',
				'@id': `${url}#webpage`,
				url,
				name,
				description,
				inLanguage: 'en-US',
			},
			breadcrumbList(url, [
				{ name: 'Home', item: `${PROD_ORIGIN}/` },
				{ name: breadcrumb, item: url },
			]),
		],
	};
}

/**
 * Home page: the Organization, the WebSite and TBMQ itself as a free
 * SoftwareApplication, so search engines read the domain as a product site.
 */
export function homeJsonLd(description: string): Record<string, unknown> {
	const url = `${PROD_ORIGIN}/`;
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
				downloadUrl: `${PROD_ORIGIN}/installations/`,
				installUrl: `${PROD_ORIGIN}/docs/installation/`,
				softwareHelp: { '@type': 'CreativeWork', url: `${PROD_ORIGIN}/docs/` },
				sameAs: GITHUB_REPO,
				author: { '@id': `${PROD_ORIGIN}/#organization` },
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: `${PROD_ORIGIN}/pricing/` },
			},
		],
	};
}

/**
 * Pricing page: TBMQ as a Product with one AggregateOffer spanning the free
 * Community Edition and the paid plans. The paid plans are usage-priced, so
 * only the floor (0, the free edition) is stated as a number.
 */
export function pricingJsonLd(description: string): Record<string, unknown> {
	const url = `${PROD_ORIGIN}/pricing/`;
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebPage',
				'@id': `${url}#webpage`,
				url,
				name: 'TBMQ Pricing',
				description,
				inLanguage: 'en-US',
			},
			breadcrumbList(url, [
				{ name: 'Home', item: `${PROD_ORIGIN}/` },
				{ name: 'Pricing', item: url },
			]),
			{
				'@type': 'Product',
				'@id': `${url}#product`,
				name: SITE_NAME,
				description,
				image: `${PROD_ORIGIN}${OG_FALLBACK}`,
				brand: { '@id': `${PROD_ORIGIN}/#organization` },
				offers: {
					'@type': 'AggregateOffer',
					url,
					priceCurrency: 'USD',
					lowPrice: '0',
					offerCount: 3,
					offers: [
						{ '@type': 'Offer', name: 'Community Edition', price: '0', priceCurrency: 'USD', url },
						{ '@type': 'Offer', name: 'Self-Managed Professional Edition', priceCurrency: 'USD', url },
						{ '@type': 'Offer', name: 'Private Cloud', priceCurrency: 'USD', url },
					],
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
				isPartOf: { '@id': `${PROD_ORIGIN}/#website` },
				author: { '@id': `${PROD_ORIGIN}/#organization` },
				publisher: { '@id': `${PROD_ORIGIN}/#organization` },
			},
			breadcrumbList(url, crumbs),
			webSite(),
			organization(),
		],
	};
}
