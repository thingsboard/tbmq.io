import { PROD_ORIGIN } from '../../../src/consts.ts';
import {
	DESC_MAX,
	DESC_MIN,
	THIN_WORDS,
	TITLE_MAX,
	TITLE_MIN,
	type Finding,
	type PageFacts,
	type Severity,
} from './types.ts';

function finding(check: string, severity: Severity, pathname: string, detail: string): Finding {
	return { check, severity, pathname, detail };
}

/** Pages that get findings of their own: neither redirect stubs nor noindex pages. */
function indexable(pages: PageFacts[]): PageFacts[] {
	return pages.filter((page) => !page.isRedirect && !page.isNoindex);
}

/** Groups pathnames by a page value, so duplicates can be reported once site-wide. */
function groupBy(pages: PageFacts[], value: (page: PageFacts) => string): Map<string, string[]> {
	const groups = new Map<string, string[]>();
	for (const page of pages) {
		const key = value(page);
		if (!key) continue;
		groups.set(key, [...(groups.get(key) ?? []), page.pathname]);
	}
	return groups;
}

export function checkMetadata(pages: PageFacts[]): Finding[] {
	const findings: Finding[] = [];
	const live = indexable(pages);

	for (const page of live) {
		const at = page.pathname;

		if (!page.title) {
			findings.push(finding('title-missing', 'high', at, 'no <title>'));
		} else if (page.title.length > TITLE_MAX) {
			findings.push(
				finding('title-too-long', 'medium', at, `${page.title.length} chars (max ${TITLE_MAX}): ${page.title}`)
			);
		} else if (page.title.length < TITLE_MIN) {
			findings.push(
				finding('title-too-short', 'low', at, `${page.title.length} chars (min ${TITLE_MIN}): ${page.title}`)
			);
		}

		if (!page.description) {
			findings.push(finding('description-missing', 'high', at, 'no <meta name="description">'));
		} else if (page.description.length > DESC_MAX) {
			findings.push(
				finding('description-too-long', 'medium', at, `${page.description.length} chars (max ${DESC_MAX})`)
			);
		} else if (page.description.length < DESC_MIN) {
			findings.push(finding('description-too-short', 'low', at, `${page.description.length} chars (min ${DESC_MIN})`));
		}

		if (page.h1Count !== 1) {
			findings.push(finding('h1-count', 'medium', at, `${page.h1Count} <h1> elements, expected exactly 1`));
		}
		if (page.wordCount < THIN_WORDS) {
			findings.push(finding('thin-content', 'low', at, `${page.wordCount} words (min ${THIN_WORDS})`));
		}
		if (!page.hasJsonLd) {
			findings.push(finding('jsonld-missing', 'medium', at, 'no application/ld+json block'));
		}
		if (!page.canonical) {
			findings.push(finding('canonical-missing', 'high', at, 'no <link rel="canonical">'));
		} else if (!page.canonical.startsWith(PROD_ORIGIN)) {
			findings.push(finding('canonical-off-origin', 'high', at, page.canonical));
		}
	}

	for (const [title, paths] of groupBy(live, (page) => page.title)) {
		if (paths.length > 1) {
			findings.push(
				finding(
					'title-duplicate',
					'medium',
					'',
					`${paths.length} pages share "${title}": ${[...paths].sort().join(', ')}`
				)
			);
		}
	}
	for (const [, paths] of groupBy(live, (page) => page.description)) {
		if (paths.length > 1) {
			findings.push(
				finding(
					'description-duplicate',
					'medium',
					'',
					`${paths.length} pages share one description: ${[...paths].sort().join(', ')}`
				)
			);
		}
	}

	return findings;
}

export function checkLinkGraph(pages: PageFacts[]): Finding[] {
	const findings: Finding[] = [];
	const live = indexable(pages);
	const known = new Set(live.map((page) => page.pathname));
	// A noindex page is still crawled and its links followed, so it keeps feeding
	// inbound counts even though it gets no findings of its own.
	const linking = pages.filter((page) => !page.isRedirect);

	const inbound = new Map<string, number>();
	for (const page of live) inbound.set(page.pathname, 0);
	for (const page of linking) {
		for (const target of page.outboundPathnames) {
			if (known.has(target) && target !== page.pathname) inbound.set(target, (inbound.get(target) ?? 0) + 1);
		}
	}

	for (const [pathname, count] of inbound) {
		if (count === 0) {
			findings.push(finding('orphan-page', 'high', pathname, 'no inbound internal links'));
		} else if (count === 1) {
			findings.push(finding('near-orphan-page', 'low', pathname, 'only 1 inbound internal link'));
		}
	}

	// Cross-linking is a property of the page's own body copy, so these two read
	// `mainOutboundPathnames`, not `outboundPathnames`. The header, sidebar and
	// footer already link into both trees from every page; measured against the
	// full link set neither check can ever fire, and a permanent 0 reads as
	// "cross-linking is healthy".
	for (const page of live) {
		if (page.section === 'mqtt' && !page.mainOutboundPathnames.some((t) => t.startsWith('/docs/'))) {
			findings.push(finding('no-crosslink-to-docs', 'medium', page.pathname, 'no /docs/ link in main content'));
		}
		if (page.section === 'docs' && !page.mainOutboundPathnames.some((t) => t.startsWith('/mqtt/'))) {
			findings.push(finding('no-crosslink-to-learn', 'low', page.pathname, 'no /mqtt/ link in main content'));
		}
	}

	return findings;
}

/**
 * The sitemap must list exactly the indexable, self-canonical pages. A listed
 * page that is noindex, a redirect stub or canonicalised elsewhere contradicts
 * itself; an indexable page left out is invisible to a crawler that starts from
 * the sitemap. Orphan pages inherited from another site show up as the former.
 */
export function checkSitemap(pages: PageFacts[]): Finding[] {
	const findings: Finding[] = [];
	for (const page of pages) {
		const at = page.pathname;
		const canonicalElsewhere = page.canonical !== null && page.canonical !== `${PROD_ORIGIN}${at}`;
		if (page.inSitemap) {
			if (page.isRedirect || page.isNoindex) {
				const what = page.isRedirect ? 'redirect stub' : 'noindex page';
				findings.push(finding('sitemap-noindex', 'high', at, `${what} listed in the sitemap`));
			} else if (canonicalElsewhere) {
				findings.push(
					finding('sitemap-non-canonical', 'high', at, `listed in the sitemap, canonical points at ${page.canonical}`)
				);
			}
		} else if (!page.isRedirect && !page.isNoindex && !canonicalElsewhere) {
			findings.push(finding('sitemap-missing', 'medium', at, 'indexable self-canonical page missing from the sitemap'));
		}
	}
	return findings;
}

/**
 * The audit's single entry point. Sorting here is what makes two runs over one
 * `dist/` byte-identical, which is the property the weekly diff depends on.
 */
export function runChecks(pages: PageFacts[]): Finding[] {
	return [...checkMetadata(pages), ...checkLinkGraph(pages), ...checkSitemap(pages)].sort(
		(a, b) => a.check.localeCompare(b.check) || a.pathname.localeCompare(b.pathname) || a.detail.localeCompare(b.detail)
	);
}
