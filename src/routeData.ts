import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIContext } from 'astro';
import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';
import { Products } from '@models/site.models.ts';
import {
	getVersionFromSlug,
	getVersionFromURL,
	getLanguageFromSlug,
	getLanguageFromURL,
	getPageSlugFromURL,
	getVersionPrefix,
	getLanguagePrefix,
	getProductTitleName,
	type SupportedLanguage,
} from '~/util/path-utils';
import { getCanonicalPathname } from '~/util/canonical';
import { allPages } from '~/content';
import { DOCS_SUFFIX, docsRootTitle, EDIT_BASE_URL, formatDocsTitle, OG_FALLBACK, TITLE_SEP } from '~/consts';
import { getOgImageUrl } from '~/util/getOgImageUrl';
import { docsJsonLd, type Crumb } from '~/util/structuredData';
// No alias covers `config/`; relative import is the only option here.
import {
	getRepoRoot,
	getSitemapSourceRegistry,
	normalizeSitemapPath,
	toRepoRelative,
} from '../config/sitemap-source-registry';

/**
 * Display names for `/reference/<api>-api/` sub-sections, used to build unique
 * SEO titles for sibling pages that share short H1s like "Attributes" or "RPC".
 */
const API_SECTION_NAMES: Record<string, string> = {
	'coap-api': 'CoAP API',
	'gateway-api': 'Gateway API',
	'http-api': 'HTTP API',
	'lwm2m-api': 'LwM2M API',
	'mqtt-api': 'MQTT API',
	'snmp-api': 'SNMP API',
};

/** Memoization cache for `linkMatchesVersion(href) && linkMatchesLanguage(href)`. */
const sidebarLinkMatchCache = new Map<string, boolean>();

/**
 * Route → frontmatter title of every docs page, from the content collection.
 * The JSON-LD breadcrumb trail names an intermediate section only when it has a
 * page of its own — a crumb pointing at a 404 is worse than a shorter trail —
 * and labels every crumb with that page's title, the label a reader navigated by.
 */
const DOCS_TITLES = new Map(allPages.map((page) => [`/${page.id}/`, page.data.title]));

type HeadItem = StarlightRouteData['head'][number];

const INCLUDES_IMPORT_REGEX = /^\s*import\s+\w+\s+from\s+['"]@includes\/([^'"]+)['"]/gm;
const JSX_COMPONENT_REGEX = /^\s*<[A-Z][A-Za-z0-9]*\b/gm;
/** filePath → include path relative to `_includes/` (e.g. `docs/introduction.mdx`), or `null`. */
const stubIncludeRelCache = new Map<string, string | null>();

export const onRequest = defineRouteMiddleware((context) => {
	const starlightRoute = context.locals.starlightRoute;
	updateHead(context);
	rewriteStubEditUrl(starlightRoute);
	recordSitemapSources(context, starlightRoute);
	filterSidebarByVersionAndLanguage(starlightRoute);
	markParentSidebarItemAsCurrent(starlightRoute, context.url.pathname);
	filterPaginationByVersion(starlightRoute);
});

/**
 * A thin stub is a wrapper page whose body is exactly 1 `@includes` import + 1
 * JSX component call — the real content lives in the include. Returns the
 * include path relative to `src/content/_includes/`, or `null` for non-stubs.
 * Shared by the "Edit page" link rewrite and the sitemap `lastmod` computation
 * so both attribute changes to the same underlying source file.
 */
function getStubIncludeRel(filePath: string): string | null {
	let rel = stubIncludeRelCache.get(filePath);
	if (rel === undefined) {
		rel = null;
		try {
			const source = readFileSync(filePath, 'utf8');
			const includeMatches = [...source.matchAll(INCLUDES_IMPORT_REGEX)];
			const jsxMatches = [...source.matchAll(JSX_COMPONENT_REGEX)];
			if (includeMatches.length === 1 && jsxMatches.length === 1) {
				rel = includeMatches[0]![1] ?? null;
			}
		} catch {
			// Source file unreadable — treat as a non-stub.
		}
		stubIncludeRelCache.set(filePath, rel);
	}
	return rel;
}

/** Thin stubs point "Edit page" at the include, not the stub. */
function rewriteStubEditUrl(starlightRoute: StarlightRouteData) {
	if (!starlightRoute.editUrl) return;
	const filePath = (starlightRoute.entry as { filePath?: string }).filePath;
	if (!filePath) return;

	const rel = getStubIncludeRel(filePath);
	if (rel) starlightRoute.editUrl = new URL(`${EDIT_BASE_URL}/src/content/_includes/${rel}`);
}

/**
 * Record the repo-relative source file(s) for a real docs content page so the
 * sitemap integration can derive `<lastmod>` from git. Only content-collection
 * pages reach this middleware with a real on-disk `entry.filePath`; everything
 * else is resolved by the integration from the route table. Pages the sitemap
 * would drop (noindex, canonical-to-elsewhere) are skipped.
 */
function recordSitemapSources(context: APIContext, starlightRoute: StarlightRouteData) {
	const filePath = (starlightRoute.entry as { filePath?: string }).filePath;
	if (!filePath) return;
	const wrapperRel = toRepoRelative(filePath);
	// Synthetic StarlightPage entries point at a non-existent file; record only
	// when the content file actually exists on disk.
	if (!wrapperRel || !existsSync(join(getRepoRoot(), wrapperRel))) return;
	if (!isIndexableSelfCanonical(context, starlightRoute)) return;

	const sources = [wrapperRel];
	const includeRel = getStubIncludeRel(filePath);
	if (includeRel) sources.push(`src/content/_includes/${includeRel}`);
	getSitemapSourceRegistry().set(normalizeSitemapPath(context.url.pathname), sources);
}

/** True when the computed head has no `noindex` and any canonical points at the page itself. */
function isIndexableSelfCanonical(context: APIContext, starlightRoute: StarlightRouteData): boolean {
	if (hasNoindexMeta(starlightRoute.head)) return false;
	const selfPath = normalizeSitemapPath(context.url.pathname);
	for (const item of starlightRoute.head) {
		if (item.tag !== 'link' || item.attrs?.rel !== 'canonical') continue;
		const href = item.attrs.href;
		if (typeof href !== 'string') continue;
		try {
			if (normalizeSitemapPath(new URL(href).pathname) !== selfPath) return false;
		} catch {
			// Unparseable canonical — keep the page rather than silently dropping it.
		}
	}
	return true;
}

function hasNoindexMeta(head: StarlightRouteData['head']): boolean {
	return head.some(
		(item) =>
			item.tag === 'meta' &&
			item.attrs?.name === 'robots' &&
			typeof item.attrs.content === 'string' &&
			/\bnoindex\b/i.test(item.attrs.content)
	);
}

/**
 * Filter sidebar entries to only show items for the current product version and language.
 */
function filterSidebarByVersionAndLanguage(starlightRoute: StarlightRouteData) {
	const version = getVersionFromSlug(starlightRoute.id);
	const lang = getLanguageFromSlug(starlightRoute.id);

	starlightRoute.sidebar = starlightRoute.sidebar.filter((entry) =>
		sidebarEntryMatchesVersionAndLanguage(entry, version, lang)
	);
}

function sidebarEntryMatchesVersionAndLanguage(
	entry: StarlightRouteData['sidebar'][number],
	version: Products,
	lang: SupportedLanguage
): boolean {
	if (entry.type === 'link') {
		const key = `${version}|${lang}|${entry.href}`;
		const cached = sidebarLinkMatchCache.get(key);
		if (cached !== undefined) return cached;
		const match = linkMatchesVersion(entry.href, version) && linkMatchesLanguage(entry.href, lang);
		sidebarLinkMatchCache.set(key, match);
		return match;
	}
	if (entry.type === 'group') {
		entry.entries = entry.entries.filter((child) => sidebarEntryMatchesVersionAndLanguage(child, version, lang));
		return entry.entries.length > 0;
	}
	return true;
}

function linkMatchesVersion(href: string, version: Products): boolean {
	let path = href;
	if (path.startsWith('/uk/')) path = path.slice(4);
	path = path.replace(/^\/docs\/?/, '');

	if (version === Products.TBMQ_PE) return path.startsWith('pe/');
	return !path.startsWith('pe/');
}

/**
 * When the current page is not a sidebar link (e.g. /docs/search/ or an anchor
 * page reached from a link in the body), mark the closest ancestor sidebar link
 * as current so that collapsed groups containing it render open.
 */
function markParentSidebarItemAsCurrent(starlightRoute: StarlightRouteData, pathname: string) {
	// If any entry is already current, nothing to do
	if (hasCurrent(starlightRoute.sidebar)) return;

	// Find the sidebar link with the longest href that is a prefix of pathname
	let bestEntry: { isCurrent: boolean } | null = null;
	let bestLen = 0;

	function walk(entries: StarlightRouteData['sidebar']) {
		for (const entry of entries) {
			if (entry.type === 'link') {
				if (pathname.startsWith(entry.href) && entry.href.length > bestLen) {
					bestLen = entry.href.length;
					bestEntry = entry;
				}
			} else if (entry.type === 'group') {
				walk(entry.entries);
			}
		}
	}

	walk(starlightRoute.sidebar);
	if (bestEntry) (bestEntry as { isCurrent: boolean }).isCurrent = true;
}

function hasCurrent(entries: StarlightRouteData['sidebar']): boolean {
	for (const entry of entries) {
		if (entry.type === 'link' && entry.isCurrent) return true;
		if (entry.type === 'group' && hasCurrent(entry.entries)) return true;
	}
	return false;
}

/**
 * Clear pagination links that cross product version boundaries.
 * Starlight builds prev/next from the combined sidebar, so without this
 * the last CE page would link to the first PE page, etc.
 */
function filterPaginationByVersion(starlightRoute: StarlightRouteData) {
	const version = getVersionFromSlug(starlightRoute.id);
	const { pagination } = starlightRoute;

	if (pagination.prev && !linkMatchesVersion(pagination.prev.href, version)) {
		pagination.prev = undefined;
	}
	if (pagination.next && !linkMatchesVersion(pagination.next.href, version)) {
		pagination.next = undefined;
	}
}

function linkMatchesLanguage(href: string, lang: SupportedLanguage): boolean {
	if (lang === 'uk') return href.startsWith('/uk/');
	return !href.startsWith('/uk/');
}

const docsPathRegex = /^\/(uk\/)?docs(\/|$)/;
const escapedSep = TITLE_SEP.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
/** Starlight's own ` | Docs` suffix (its `title:` is `Docs`), stripped before ours is appended. */
const docsSuffixMatcher = new RegExp(`${escapedSep}${DOCS_SUFFIX}$`);
const apiPathMatcher = /^reference\/([^/]+)\//;

function updateHead(context: APIContext) {
	const starlightRoute = context.locals.starlightRoute;
	starlightRoute.head = starlightRoute.head.filter(
		(item) => !(item.tag === 'meta' && item.attrs?.name === 'generator')
	);
	const { head, entry } = starlightRoute;

	// Single pass collecting all head entries we will mutate or test later
	// (avoids separate find()/some() walks).
	let title: (typeof head)[number] | undefined;
	let ogTitle: (typeof head)[number] | undefined;
	let ogUrl: (typeof head)[number] | undefined;
	let ogImage: (typeof head)[number] | undefined;
	let canonical: (typeof head)[number] | undefined;
	for (const item of head) {
		if (item.tag === 'title') {
			title = item;
		} else if (item.tag === 'meta') {
			const property = item.attrs?.property;
			if (property === 'og:title') ogTitle = item;
			else if (property === 'og:url') ogUrl = item;
			else if (property === 'og:image') ogImage = item;
		} else if (item.tag === 'link' && item.attrs?.rel === 'canonical') {
			canonical = item;
		}
	}

	const pathname = context.url.pathname;
	// Title formatting and canonical consolidation only apply to real `/docs/`
	// pages. Marketing pages render through `StarlightPage` too, so gate the
	// docs-only work here to skip their per-page version/slug/canonical lookups.
	const isDocs = docsPathRegex.test(pathname);
	const docsHeadline = isDocs && title?.content ? applyDocsTitle(pathname, entry, title, ogTitle) : undefined;

	// Marketing pages author their own `og:image` in frontmatter; only emit ours
	// when none is present, else BaseLayout pages get a duplicate `og:image`.
	if (!ogImage) {
		const imageSrc = getOgImageUrl(pathname) ?? OG_FALLBACK;
		// Use request origin so dev shows localhost; in static build it equals context.site origin.
		const canonicalImageSrc = new URL(imageSrc, context.url.origin).href;

		head.push({ tag: 'meta', attrs: { property: 'og:image', content: canonicalImageSrc } });
	}

	// Search pages render a search widget with no indexable content. Keep them
	// out of search results (consistent with the sitemap exclusion).
	if (pathname.endsWith('/search/')) {
		head.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, follow' } });
	}

	// Docs-only: a marketing page's synthetic `entry.id` would default to CE and
	// rewrite e.g. `/` → `/docs/pe/`.
	if (isDocs) {
		const canonicalPathname = applyDocsCanonical(context, entry, canonical, ogUrl);
		if (docsHeadline && !hasNoindexMeta(head)) {
			pushDocsJsonLd(head, entry, canonicalPathname, docsHeadline, context.site!);
		}
	}
}

/**
 * Formats a docs page's `<title>` (and `og:title`) and returns the page's own
 * name — the part before the ` | TBMQ Docs` suffix, which the JSON-LD uses as
 * its headline.
 */
function applyDocsTitle(
	pathname: string,
	entry: StarlightRouteData['entry'],
	title: HeadItem,
	ogTitle: HeadItem | undefined
): string {
	// Per-page `customDocsTitle` frontmatter overrides the auto-formatted docs
	// title entirely. Used by the two docs roots, whose <title> names the product
	// rather than the page ("TBMQ Docs | Open-Source MQTT Broker Documentation").
	const customDocsTitle = (entry.data as { customDocsTitle?: string }).customDocsTitle;
	let headline: string;
	if (customDocsTitle) {
		title.content = customDocsTitle;
		headline = customDocsTitle.split(TITLE_SEP)[0]!;
	} else {
		const product = getVersionFromURL(pathname);
		const productTitleName = getProductTitleName(product);
		const versionBase = `/${getLanguagePrefix(getLanguageFromURL(pathname))}docs/${getVersionPrefix(product)}`;
		if (pathname === versionBase) {
			headline = docsRootTitle(productTitleName);
			title.content = headline;
		} else {
			let pageTitle = title.content!.replace(docsSuffixMatcher, '');
			// Auto-append API section name to disambiguate sibling reference pages
			// (e.g. several `/reference/<x>-api/attributes/` pages all share H1 "Attributes").
			// Skipped when the page sets its own <title> via frontmatter `head`.
			const entryHead = (entry.data as { head: StarlightRouteData['head'] }).head;
			if (!entryHead.some((item) => item.tag === 'title')) {
				const apiMatch = getPageSlugFromURL(pathname).match(apiPathMatcher);
				const apiName = apiMatch ? API_SECTION_NAMES[apiMatch[1]!] : undefined;
				if (apiName) pageTitle = `${pageTitle} - ${apiName}`;
			}
			headline = pageTitle;
			title.content = formatDocsTitle(pageTitle, productTitleName);
		}
	}
	if (ogTitle) ogTitle.attrs!['content'] = title.content;
	return headline;
}

/**
 * Canonical: free product versions → professional equivalents, plus explicit
 * frontmatter overrides. See `getCanonicalPathname` — also drives sitemap
 * exclusion so the two stay in lockstep. Returns the canonical pathname.
 */
function applyDocsCanonical(
	context: APIContext,
	entry: StarlightRouteData['entry'],
	canonical: HeadItem | undefined,
	ogUrl: HeadItem | undefined
): string {
	const canonicalPathname = getCanonicalPathname(
		entry.id,
		entry.data as { selfCanonical?: boolean; canonicalUrl?: string }
	);
	const pathname = context.url.pathname;
	const selfPathname = pathname.endsWith('/') ? pathname : pathname + '/';
	if (canonicalPathname !== selfPathname) {
		const targetCanonical = new URL(canonicalPathname, context.site).href;
		if (canonical) canonical.attrs!['href'] = targetCanonical;
		if (ogUrl) ogUrl.attrs!['content'] = targetCanonical;
	}
	return canonicalPathname;
}

/**
 * Structured data for an indexable docs page, built from the canonical pathname
 * so a CE page carries the same graph as the PE page it canonicalises to — the
 * two must not disagree about what the article is.
 */
function pushDocsJsonLd(
	head: StarlightRouteData['head'],
	entry: StarlightRouteData['entry'],
	canonicalPathname: string,
	headline: string,
	site: URL
) {
	const { description } = entry.data as { description?: string };
	head.push({
		tag: 'script',
		attrs: { type: 'application/ld+json' },
		content: JSON.stringify(
			docsJsonLd({
				url: new URL(canonicalPathname, site).href,
				headline,
				description,
				crumbs: docsBreadcrumbs(canonicalPathname, site),
			})
		),
	});
}

/**
 * Home → `TBMQ Docs` / `TBMQ PE Docs` → each ancestor section that has an index
 * page of its own → the page, every crumb below the root named by its page's title.
 */
function docsBreadcrumbs(canonicalPathname: string, site: URL): Crumb[] {
	const product = getVersionFromURL(canonicalPathname);
	const lang = getLanguageFromURL(canonicalPathname);
	const docsRoot = `/${getLanguagePrefix(lang)}docs/${getVersionPrefix(product)}`;
	const crumbs: Crumb[] = [
		{ name: 'Home', item: new URL('/', site).href },
		{ name: docsRootTitle(getProductTitleName(product)), item: new URL(docsRoot, site).href },
	];

	let current = docsRoot;
	for (const segment of canonicalPathname.slice(docsRoot.length).split('/').filter(Boolean)) {
		current += `${segment}/`;
		const title = DOCS_TITLES.get(current);
		if (title) crumbs.push({ name: title, item: new URL(current, site).href });
	}
	return crumbs;
}
