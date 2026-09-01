import fs from 'node:fs';
import path from 'node:path';
import { DomUtils, parseDocument } from 'htmlparser2';
import type { Element } from 'domhandler';
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

export function collectFacts(html: string, pathname: string): PageFacts {
	const dom = parseDocument(html);
	const tags = (name: string) => DomUtils.getElementsByTagName(name, dom, true) as Element[];
	const metas = tags('meta');
	const titleEl = tags('title')[0];
	const mainEl = tags('main')[0] ?? tags('body')[0];

	const outbound = new Set<string>();
	for (const anchor of tags('a')) {
		const target = normaliseHref(anchor.attribs.href ?? anchor.attribs['xlink:href']);
		if (target && target !== pathname) outbound.add(target);
	}

	const text = mainEl ? DomUtils.innerText(mainEl).trim() : '';

	return {
		pathname,
		section: sectionOf(pathname),
		isRedirect: metas.some((m) => m.attribs['http-equiv']?.toLowerCase() === 'refresh'),
		title: titleEl ? DomUtils.innerText(titleEl).trim() : '',
		description: metas.find((m) => m.attribs.name?.toLowerCase() === 'description')?.attribs.content?.trim() ?? '',
		h1Count: tags('h1').length,
		wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
		hasJsonLd: tags('script').some((s) => s.attribs.type === 'application/ld+json'),
		canonical:
			tags('link')
				.find((l) => l.attribs.rel?.toLowerCase() === 'canonical')
				?.attribs.href?.trim() ?? null,
		outboundPathnames: [...outbound],
	};
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
	return pathnames.map((pathname) =>
		collectFacts(fs.readFileSync(path.join(buildOutputDir, pathname, 'index.html'), 'utf8'), pathname)
	);
}
