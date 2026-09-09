import fs from 'node:fs';
import path from 'node:path';
import { DomUtils, parseDocument } from 'htmlparser2';
import type { AnyNode, Element } from 'domhandler';
import { getPagePathnamesFromBuildOutput } from '../linkcheck/steps/build-index.ts';
import { PROD_ORIGIN } from '../../../src/consts.ts';
import type { PageFacts, Section } from './types.ts';

export function sectionOf(pathname: string): Section {
	if (pathname.startsWith('/docs/')) return 'docs';
	if (pathname.startsWith('/mqtt/')) return 'mqtt';
	return 'other';
}

/**
 * Reduces an href to the pathname of a same-origin page, or null if it is not one.
 *
 * Parts of the build emit absolute `https://tbmq.io/…` hrefs rather than relative
 * ones, so the origin rewrite is not optional: without it those links are read as
 * external and their targets look like orphans.
 */
export function normaliseHref(href: string | undefined, origin: string = PROD_ORIGIN): string | null {
	if (!href) return null;
	let raw = href.trim();
	if (raw === origin) return '/';
	if (raw.startsWith(`${origin}/`)) raw = raw.slice(origin.length);
	// Protocol-relative URLs are external despite the leading slash.
	if (raw.startsWith('//') || !raw.startsWith('/')) return null;
	raw = raw.split('#')[0].split('?')[0];
	if (!raw) return null;
	// A dotted last segment is an asset, not a page: `trailingSlash` does not apply.
	const lastSegment = raw.slice(raw.lastIndexOf('/') + 1);
	if (lastSegment.includes('.')) return raw;
	return raw.endsWith('/') ? raw : `${raw}/`;
}

/** Everything one document says about itself; `inSitemap` needs the sitemap and is added by `collectPages`. */
export function collectFacts(html: string, pathname: string): Omit<PageFacts, 'inSitemap'> {
	const dom = parseDocument(html);
	const tags = (name: string, root: AnyNode = dom) => DomUtils.getElementsByTagName(name, root, true) as Element[];
	const metas = tags('meta');
	const titleEl = tags('title')[0];
	const mainEl = tags('main')[0] ?? tags('body')[0];

	/** Same-origin pages linked from within `root`, deduplicated and self-links dropped. */
	const linkedPages = (root: AnyNode): string[] => {
		const targets = new Set<string>();
		for (const anchor of tags('a', root)) {
			const target = normaliseHref(anchor.attribs.href ?? anchor.attribs['xlink:href']);
			if (target && target !== pathname) targets.add(target);
		}
		return [...targets];
	};

	const text = mainEl ? DomUtils.innerText(mainEl).trim() : '';
	const robots = metas.find((m) => m.attribs.name?.toLowerCase() === 'robots')?.attribs.content ?? '';

	return {
		pathname,
		section: sectionOf(pathname),
		isRedirect: metas.some((m) => m.attribs['http-equiv']?.toLowerCase() === 'refresh'),
		isNoindex: /\bnoindex\b/i.test(robots),
		title: titleEl ? DomUtils.innerText(titleEl).trim() : '',
		description: metas.find((m) => m.attribs.name?.toLowerCase() === 'description')?.attribs.content?.trim() ?? '',
		h1Count: tags('h1').length,
		wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
		hasJsonLd: tags('script').some((s) => s.attribs.type === 'application/ld+json'),
		canonical:
			tags('link')
				.find((l) => l.attribs.rel?.toLowerCase() === 'canonical')
				?.attribs.href?.trim() ?? null,
		outboundPathnames: linkedPages(dom),
		mainOutboundPathnames: mainEl ? linkedPages(mainEl) : [],
	};
}

/** The `<loc>` entries of one sitemap document as normalised same-origin pathnames, in file order. */
export function parseSitemapPathnames(xml: string): string[] {
	const pathnames: string[] = [];
	for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
		const pathname = normaliseHref(match[1]);
		if (pathname) pathnames.push(pathname);
	}
	return pathnames;
}

/**
 * Every page URL the build's sitemap lists, read through `sitemap-index.xml`.
 * A missing sitemap is an error rather than an empty set: an empty set would
 * report every page as `sitemap-missing` and bury the real findings.
 */
export function readSitemapPathnames(buildOutputDir: string): Set<string> {
	const indexPath = path.join(buildOutputDir, 'sitemap-index.xml');
	if (!fs.existsSync(indexPath)) {
		throw new Error(`no sitemap-index.xml in "${buildOutputDir}" — run pnpm build:linkcheck first`);
	}
	const pathnames = new Set<string>();
	for (const sitemapFile of parseSitemapPathnames(fs.readFileSync(indexPath, 'utf8'))) {
		const xml = fs.readFileSync(path.join(buildOutputDir, sitemapFile), 'utf8');
		for (const pathname of parseSitemapPathnames(xml)) pathnames.add(pathname);
	}
	return pathnames;
}

export function collectPages(buildOutputDir = './dist'): PageFacts[] {
	if (!fs.existsSync(buildOutputDir)) {
		throw new Error(`no build output at "${buildOutputDir}" — run pnpm build:linkcheck first`);
	}
	const pathnames = getPagePathnamesFromBuildOutput({
		baseUrl: PROD_ORIGIN,
		buildOutputDir,
		pageSourceDir: './src/content/docs',
		checks: [],
	});
	if (pathnames.length === 0) {
		throw new Error(`"${buildOutputDir}" exists but contains no pages — run pnpm build:linkcheck first`);
	}
	const sitemap = readSitemapPathnames(buildOutputDir);
	return pathnames.map((pathname) => ({
		...collectFacts(fs.readFileSync(path.join(buildOutputDir, pathname, 'index.html'), 'utf8'), pathname),
		inSitemap: sitemap.has(pathname),
	}));
}
