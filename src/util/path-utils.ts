// Language system
import { Products } from '@models/site.models.ts';
import { SECTION_LABELS, SITE_NAME } from '@root/consts';

export type SupportedLanguage = 'en' | 'uk';

/** Language configuration */
const supportedLanguages: Record<SupportedLanguage, { label: string; prefix: string }> = {
	en: { label: 'English', prefix: '' },
	uk: { label: 'Українська', prefix: 'uk/' },
};

/** Product version configuration.
 *  `label` is used in version-switcher UI; `titleName` is the SEO brand form used in <title> tags. */
export const productVersions: Record<Products, { label: string; prefix: string; titleName: string }> = {
	[Products.TBMQ]: {
		label: 'TBMQ Broker',
		prefix: '',
		titleName: 'ThingsBoard TBMQ',
	},
	[Products.TBMQ_PE]: {
		label: 'TBMQ PE Broker',
		prefix: 'pe/',
		titleName: 'ThingsBoard TBMQ PE',
	},
};

/** Detect language from a URL pathname. */
export function getLanguageFromURL(pathname: string): SupportedLanguage {
	if (pathname.startsWith('/uk/')) return 'uk';
	return 'en';
}

/** Detect language from a content entry slug. */
export function getLanguageFromSlug(slug: string): SupportedLanguage {
	if (slug.startsWith('uk/')) return 'uk';
	return 'en';
}

/** Get the URL prefix for a language. */
export function getLanguagePrefix(lang: SupportedLanguage): string {
	return supportedLanguages[lang].prefix;
}

/** Strip language prefix from path. */
export function stripLanguagePrefix(path: string): string {
	if (path.startsWith('uk/')) return path.slice(3);
	return path;
}

/**
 * Detect product version from a URL pathname.
 * URL structure: /docs/pe/... or /uk/docs/pe/...
 */
export function getVersionFromURL(pathname: string): Products {
	let path = pathname;
	// Remove language prefix if present
	if (path.startsWith('/uk/')) path = path.slice(3);
	// Remove /docs/ prefix
	path = path.replace(/^\/docs\/?/, '');
	// Normalize: ensure trailing slash so index paths like "pe" match the "pe/" prefix
	const p = path.endsWith('/') ? path : path + '/';

	if (p.startsWith('pe/')) return Products.TBMQ_PE;
	return Products.TBMQ;
}

/**
 * Detect product version from a content entry slug.
 * Slug structure: docs/pe/... or uk/docs/pe/...
 */
export function getVersionFromSlug(slug: string): Products {
	let path = slug;
	// Remove language prefix
	path = stripLanguagePrefix(path);
	// Remove docs/ prefix
	if (path.startsWith('docs/')) path = path.slice(5);
	// Normalize: ensure trailing slash so index slugs like "pe" match the "pe/" prefix
	const p = path.endsWith('/') ? path : path + '/';

	if (p.startsWith('pe/')) return Products.TBMQ_PE;
	return Products.TBMQ;
}

/** Get the URL prefix for a product version. */
export function getVersionPrefix(version: Products): string {
	return productVersions[version]?.prefix ?? '';
}

/** Get the SEO brand form of a product name, used in <title> tags. */
export function getProductTitleName(version: Products): string {
	return productVersions[version]?.titleName ?? SITE_NAME;
}

/** Marketing-section label for a pathname (e.g. 'Blog'), or undefined when the page
 *  is not inside a tracked section (defined in SECTION_LABELS). */
export function getSectionFromPath(pathname: string): string | undefined {
	const p = pathname.endsWith('/') ? pathname : pathname + '/';
	for (const [prefix, label] of Object.entries(SECTION_LABELS)) {
		if (p.startsWith(prefix)) return label;
	}
	return undefined;
}

/** Get the base/landing URL for a product version (in English). */
export function getVersionBaseURL(version: Products, lang: SupportedLanguage = 'en'): string {
	const langPrefix = getLanguagePrefix(lang);
	const versionPrefix = getVersionPrefix(version);
	return `/${langPrefix}docs/${versionPrefix}`;
}

/**
 * Get the page slug (without language, docs, and version prefix) from a URL pathname.
 * E.g. '/uk/docs/pe/guides/routing/' => 'guides/routing'
 */
export function getPageSlugFromURL(pathname: string): string {
	let path = pathname;
	// Remove language prefix (keep leading slash)
	if (path.startsWith('/uk/')) path = path.slice(3);
	// Remove /docs/ prefix
	path = path.replace(/^\/docs\/?/, '');
	// Strip version prefix
	if (path.startsWith('pe/')) path = path.slice(3);
	return path.replace(/^\/|\/$/g, '');
}

/**
 * Build version switch URL, falling back to the version's base page
 * if the equivalent page doesn't exist in the target version.
 * @param pathname - current URL pathname
 * @param targetVersion - version to switch to
 * @param existingPageIds - set of all existing content page IDs (slugs)
 */
export function switchVersionWithFallback(
	pathname: string,
	targetVersion: Products,
	existingPageIds: Set<string>
): string {
	const lang = getLanguageFromURL(pathname);
	const pageSlug = getPageSlugFromURL(pathname);
	const langPrefix = getLanguagePrefix(lang);
	const versionPrefix = getVersionPrefix(targetVersion);

	// Build the target content ID (slug format: docs/... or uk/docs/...)
	const docsPrefix = lang === 'uk' ? 'uk/docs/' : 'docs/';
	const targetId = `${docsPrefix}${versionPrefix}${pageSlug}`;

	if (existingPageIds.has(targetId)) {
		return `/${langPrefix}docs/${versionPrefix}${pageSlug}/`;
	}

	// Fallback to the base page of the target version
	return getVersionBaseURL(targetVersion, lang);
}
