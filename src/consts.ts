export const SITE_NAME = 'TBMQ';
export const DOCS_SUFFIX = 'Docs';
export const TITLE_SEPARATOR = '|';

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

/**
 * Google Programmable Search Engine id (`cx`) behind the header search modal
 * and the /docs/search/ + /docs/pe/search/ pages. The domain the results come
 * from (tbmq.io) is configured in the PSE control panel, not in this repo —
 * pointing search at another domain means creating a new engine there and
 * swapping this id.
 */
export const GOOGLE_CSE_CX = 'a0cca37fad72c4a8e';

/**
 * Astro dev with `trailingSlash: 'always'` 404s dynamic-route URLs that end in
 * `.png`, so generated card URLs get a trailing slash in dev only — production
 * keeps the clean URL Cloudflare Pages serves directly. The global fallback is
 * a real static file and stays untouched.
 */
export function devSafeOgImagePath(imagePath: string): string {
	if (import.meta.env?.DEV && /\.png$/.test(imagePath) && imagePath !== OG_FALLBACK) {
		return imagePath + '/';
	}
	return imagePath;
}

const SEP = ` ${TITLE_SEPARATOR} `;

export const SECTION_LABELS: Record<string, string> = {
	'/blog/': 'Blog',
};

export function formatSectionIndexTitle(section: string): string {
	return `${section}${SEP}${SITE_NAME}`;
}

export function formatMarketingTitle(title: string, section?: string): string {
	// Strip any legacy " | ThingsBoard" baked into the title prop (some pages include it themselves)
	const clean = title.replace(/\s*\|\s*ThingsBoard\s*$/i, '').trim();
	if (!section) return `${clean}${SEP}${SITE_NAME}`;
	if (clean === section) return formatSectionIndexTitle(section);
	return `${clean}${SEP}${section}${SEP}${SITE_NAME}`;
}

export function formatDocsTitle(pageTitle: string, productName: string, isIndex: boolean): string {
	return isIndex ? `${DOCS_SUFFIX}${SEP}${productName}` : `${pageTitle}${SEP}${DOCS_SUFFIX}${SEP}${productName}`;
}
