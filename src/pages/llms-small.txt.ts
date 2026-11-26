import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { PROD_ORIGIN } from '~/consts';
import { mqttCategoryGroups, mqttTopics, topicHref } from '~/data/mqttLearn';

export const prerender = true;

const SITE_URL = PROD_ORIGIN;

// Astro 6 docsLoader id format: index pages drop the `/index` suffix
// (e.g., src/content/docs/docs/index.mdx → id "docs",
// not "docs/index"). Subtree patterns end in `/**` and also
// auto-exclude their bare prefix below.
const EXCLUDE_PATTERNS = [
	// Utility pages with no prose worth cataloguing.
	'docs/search',
	'docs/newsletter-thanks',
	'docs/pe/search',

	// Release churn — these go stale between builds, and GitHub releases are
	// the canonical source (linked from llms.txt).
	'docs/changelog',
	'docs/releases',
	'docs/roadmap',
	'docs/pe/changelog',
	'docs/pe/releases',
	'docs/pe/roadmap',
];

// The PE tree is a superset of the CE tree — both editions render the same
// shared `_includes` content, so cataloguing both would duplicate nearly every
// entry. PE is canonical here; only CE pages with no PE counterpart are kept.
const PE_PREFIX = 'docs/pe';
const CE_ONLY_PAGES = ['docs/installation/building-from-source'];
// TBMQ Lite is a product of its own with pages no other tree renders, so all of them are kept.
const LITE_PREFIX = 'docs/lite';

// Entry points first, so a consumer reading top-down meets the overview pages
// before the leaf pages. Everything else falls back to id order.
const PROMOTE = [
	'docs/pe',
	'docs/pe/why-tbmq',
	'docs/pe/getting-started',
	'docs/pe/architecture',
	'docs/pe/installation',
	'docs/pe/security/overview',
	'docs/pe/user-guide',
	'docs/pe/integrations',
	'docs/pe/rest-api',
	'docs/pe/reference',
	'docs/lite',
];

function globToRegExp(glob: string): RegExp {
	const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
	// NUL can never occur in a docs id, so it is a safe placeholder for `**`
	// while single `*` is rewritten. Spelled as an escape (not a literal NUL
	// byte) so git treats this file as text and can diff it.
	const doubleStarToken = '\u0000DS\u0000';
	const withDoubleStar = escaped.replace(/\*\*/g, doubleStarToken);
	const withStars = withDoubleStar.replace(/\*/g, '[^/]*');
	const final = withStars.split(doubleStarToken).join('.+');
	return new RegExp(`^${final}$`);
}

// For patterns ending in `/**`, also exclude the bare prefix so a subtree
// exclusion ("docs/other/**") also drops the section's index entry
// ("docs/other"). Standard glob semantics require ≥1 trailing segment.
const EXCLUDE_REGEXPS = EXCLUDE_PATTERNS.flatMap((p) =>
	p.endsWith('/**') ? [globToRegExp(p), globToRegExp(p.slice(0, -3))] : [globToRegExp(p)]
);

function isExcluded(slug: string): boolean {
	return EXCLUDE_REGEXPS.some((re) => re.test(slug));
}

function isProfessionalEdition(slug: string): boolean {
	return slug === PE_PREFIX || slug.startsWith(`${PE_PREFIX}/`);
}

function isLite(slug: string): boolean {
	return slug === LITE_PREFIX || slug.startsWith(`${LITE_PREFIX}/`);
}

function isCommunityEdition(slug: string): boolean {
	if (isProfessionalEdition(slug) || isLite(slug)) return false;
	return slug === 'docs' || slug.startsWith('docs/');
}

function slugToUrl(slug: string): string {
	const cleaned = slug.replace(/\/index$/, '');
	return `${SITE_URL}/${cleaned}/`;
}

function escapeMarkdown(text: string): string {
	return text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function catalogLine(title: string, url: string, description?: string): string {
	return description ? `- [${title}](${url}): ${description}` : `- [${title}](${url})`;
}

export const GET: APIRoute = async () => {
	if (process.env.SKIP_LLMS) {
		return new Response('', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
	}

	const all = await getCollection('docs');

	// EN only — drop the Ukrainian (and any future locale) variants from the catalog.
	const en = all.filter((entry) => !entry.id.startsWith('uk/'));

	const kept = en.filter((entry) => {
		if (isExcluded(entry.id)) return false;
		if (isCommunityEdition(entry.id)) return CE_ONLY_PAGES.includes(entry.id);
		return true;
	});

	const promoteIndex = new Map(PROMOTE.map((p, i) => [p, i]));
	kept.sort((a, b) => {
		const ia = promoteIndex.get(a.id);
		const ib = promoteIndex.get(b.id);
		if (ia !== undefined && ib !== undefined) return ia - ib;
		if (ia !== undefined) return -1;
		if (ib !== undefined) return 1;
		return a.id.localeCompare(b.id);
	});

	const docLines = kept.map((entry) => {
		const data = entry.data as { title?: string; description?: string } | undefined;
		const title = escapeMarkdown(data?.title || entry.id);
		const description = data?.description ? escapeMarkdown(data.description) : undefined;
		return catalogLine(title, slugToUrl(entry.id), description);
	});

	const guideSections = mqttCategoryGroups.map((group) =>
		[
			`### ${group.label}`,
			'',
			group.topics
				.map((topic) =>
					catalogLine(
						escapeMarkdown(topic.title),
						`${SITE_URL}${topicHref(topic.slug)}`,
						escapeMarkdown(topic.seoDescription)
					)
				)
				.join('\n'),
		].join('\n')
	);

	const header = `<SYSTEM>This is the content catalog for TBMQ, the open-source MQTT broker by ThingsBoard. Each entry lists a page title, one-line description, and canonical URL. Fetch a page URL directly (HTML) to read its full body.</SYSTEM>

# TBMQ — content catalog

> ${docLines.length} documentation pages plus ${mqttTopics.length} MQTT protocol guides. Documentation URLs point at the Professional Edition tree, which is a superset of Community Edition; the same page exists for CE at the identical path without the \`/pe\` segment.`;

	const body = [
		header,
		'## Documentation',
		docLines.join('\n'),
		'## MQTT protocol guides',
		guideSections.join('\n\n'),
	].join('\n\n');

	return new Response(body + '\n', {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
