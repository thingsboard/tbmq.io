// Helpers for page-level JSON-LD structured data (schema.org).
//
// Kept minimal and warning-free: a WebPage node plus a BreadcrumbList (which is
// eligible for a breadcrumb rich result). We deliberately avoid SoftwareApplication
// with offers/ratings, since a valid rich result there would need real review data.

// Production origin. Must match the `site` configured in astro.config.ts (used for
// canonical URLs). Kept as one constant so absolute @id/url values stay consistent.
const SITE_ORIGIN = 'https://tbmq.io';

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
	const url = `${SITE_ORIGIN}${path}`;
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
			{
				'@type': 'BreadcrumbList',
				'@id': `${url}#breadcrumb`,
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
					{ '@type': 'ListItem', position: 2, name: breadcrumb, item: url },
				],
			},
		],
	};
}
