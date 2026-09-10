export const SITE_NAME = 'TBMQ';
export const DOCS_SUFFIX = 'Docs';
export const TITLE_SEPARATOR = '|';
/** The separator as it sits between two title parts. */
export const TITLE_SEP = ` ${TITLE_SEPARATOR} `;

/**
 * Production site origin. SEO canonicals and the link checker's "treat as
 * local" allow-list both anchor to this regardless of `PUBLIC_SITE_URL` /
 * preview origins, so that canonical hrefs and absolute-URL detection stay
 * stable across staging and production builds.
 */
export const PROD_ORIGIN = 'https://tbmq.io';

/** Base for "Edit page" links — Starlight's editLink and the stub-rewrite middleware share it. */
export const EDIT_BASE_URL = 'https://github.com/thingsboard/tbmq.io/edit/main';

/** Global OG-card fallback for pages without a generated per-page card. */
export const OG_FALLBACK = '/tbmq-og.png';

/** Stable public URL of the TBMQ logo, referenced from JSON-LD `publisher.logo`. */
export const SITE_LOGO = '/tbmq-logo.svg';

export const GITHUB_REPO_URL = 'https://github.com/thingsboard/tbmq';
/** The X (Twitter) handle behind the `twitter:site` card meta. */
export const X_HANDLE = '@thingsboard';
/** Public profiles of the project, published as the Organization's `sameAs`. */
export const SOCIAL_PROFILE_URLS = [GITHUB_REPO_URL, `https://x.com/${X_HANDLE.slice(1)}`];

/** Fragment of the site-wide Organization node's `@id`, resolved against the site origin. */
export const ORGANIZATION_NODE = '/#organization';

export const BLOG_NAME = `${SITE_NAME} Blog`;
export const BLOG_DESCRIPTION =
	'The TBMQ blog: release announcements, performance benchmarks, MQTT protocol deep dives and engineering write-ups from the team behind the broker.';

/**
 * schema.org Organization node every JSON-LD graph on the site shares, as
 * `publisher`, `author` or `brand`. One body for one `@id`: a graph that
 * described the node differently would contradict the others.
 */
export function organizationJsonLd(site: URL) {
	return {
		'@type': 'Organization',
		'@id': new URL(ORGANIZATION_NODE, site).href,
		name: SITE_NAME,
		url: site.origin,
		logo: { '@type': 'ImageObject', url: new URL(SITE_LOGO, site).href },
		sameAs: SOCIAL_PROFILE_URLS,
	};
}

/**
 * Google Programmable Search Engine id (`cx`) behind the header search modal
 * and the /docs/search/ + /docs/pe/search/ pages. The domain the results come
 * from (tbmq.io) is configured in the PSE control panel, not in this repo —
 * pointing search at another domain means creating a new engine there and
 * swapping this id.
 */
export const GOOGLE_CSE_CX = 'a0cca37fad72c4a8e';

export const SECTION_LABELS: Record<string, string> = {
	'/blog/': 'Blog',
};

export function formatSectionIndexTitle(section: string): string {
	return `${section}${TITLE_SEP}${SITE_NAME}`;
}

export function formatMarketingTitle(title: string, section?: string): string {
	// Strip any legacy " | ThingsBoard" baked into the title prop (some pages include it themselves)
	const clean = title.replace(/\s*\|\s*ThingsBoard\s*$/i, '').trim();
	if (!section) return `${clean}${TITLE_SEP}${SITE_NAME}`;
	if (clean === section) return formatSectionIndexTitle(section);
	return `${clean}${TITLE_SEP}${section}${TITLE_SEP}${SITE_NAME}`;
}

/** `TBMQ Docs` / `TBMQ PE Docs`: the title of a docs root and the suffix of every page below it. */
export function docsRootTitle(productName: string): string {
	return `${productName} ${DOCS_SUFFIX}`;
}

/**
 * `Page title | TBMQ Docs` / `Page title | TBMQ PE Docs`. The edition sits inside
 * the suffix so CE/PE pairs stay distinct while the boilerplate stays short
 * enough to leave the page title visible in search results.
 */
export function formatDocsTitle(pageTitle: string, productName: string): string {
	return `${pageTitle}${TITLE_SEP}${docsRootTitle(productName)}`;
}
