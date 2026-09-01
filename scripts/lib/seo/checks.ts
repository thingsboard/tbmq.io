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
	const live = pages.filter((page) => !page.isRedirect);

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
				finding('title-duplicate', 'medium', '', `${paths.length} pages share "${title}": ${paths.join(', ')}`)
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
					`${paths.length} pages share one description: ${paths.join(', ')}`
				)
			);
		}
	}

	return findings;
}
