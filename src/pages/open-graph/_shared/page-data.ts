// src/pages/open-graph/_shared/page-data.ts
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import { allPages } from '~/content';
import { formatBlogDate, getSectionLabel, isAllowlistedMarketingPath, truncate } from '~/util/ogContext';
import { getLanguageFromSlug } from '~/util/path-utils';
import type { CardProps } from './Card';
import { getDocsProductMeta } from './product-meta';
import { getMarketingOverride, getMarketingSection } from './marketing-meta';
import { BLOG_AUTHORS } from '~/data/blog/authors';
import { CATEGORY_LABELS } from '~/data/blog/categories';

export interface CardInput {
	/** URL-shaped slug used as the path parameter in the endpoint */
	slug: string;
	props: CardProps;
}

const TITLE_MAX = 120;

/** docs collection — EN only; UK reuses EN cards via getOgImageUrl path normalization. */
export async function getDocsCardInputs(): Promise<CardInput[]> {
	return allPages
		.filter((page) => getLanguageFromSlug(page.id) === 'en')
		.filter((page) => page.id !== 'docs') // /docs/ landing is owned by getCollectionIndexInputs
		.map((page) => {
			const meta = getDocsProductMeta(page.id);
			const section = getSectionLabel(page.id);
			const eyebrow = section ? `Documentation · ${section}` : 'Documentation';
			return {
				slug: stripDocsPrefix(page.id),
				props: {
					variant: 'docs' as const,
					meta,
					eyebrow,
					title: truncate(page.data.title, TITLE_MAX),
				},
			};
		});
}

function prettyCategory(slug: string): string {
	return slug
		.split('-')
		.map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
		.join(' ');
}

function authorName(slug: string): string {
	return BLOG_AUTHORS.find((a) => a.slug === slug)?.name ?? slug;
}

/** blog collection — posts + index + author landings + category landings. */
export async function getBlogCardInputs(): Promise<CardInput[]> {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	const inputs: CardInput[] = [];

	// /blog/{post-slug}/
	for (const post of posts) {
		const category = post.data.categories?.[0] ? prettyCategory(post.data.categories[0]!) : 'Article';
		inputs.push({
			slug: post.id,
			props: {
				variant: 'logo' as const,
				sectionName: 'Blog',
				eyebrow: `${category} · ${formatBlogDate(post.data.date)}`,
				title: truncate(post.data.title, TITLE_MAX),
				authorLine: `By ${authorName(post.data.author)}`,
			},
		});
	}

	// /blog/  (collection index)
	inputs.push({
		slug: 'index',
		props: {
			variant: 'logo' as const,
			sectionName: 'Blog',
			eyebrow: 'Latest articles',
			title: 'TBMQ Blog',
		},
	});

	// /blog/author/{author-slug}/
	for (const author of BLOG_AUTHORS) {
		inputs.push({
			slug: `author/${author.slug}`,
			props: {
				variant: 'logo' as const,
				sectionName: 'Blog',
				eyebrow: 'Author',
				title: author.name,
			},
		});
	}

	// /blog/category/{category-slug}/
	for (const [slug, label] of Object.entries(CATEGORY_LABELS)) {
		inputs.push({
			slug: `category/${slug}`,
			props: {
				variant: 'logo' as const,
				sectionName: 'Blog',
				eyebrow: 'Category',
				title: label,
			},
		});
	}

	return inputs;
}

/** Marketing landings — allowlist of /src/pages/*.astro routes. */
export async function getMarketingCardInputs(): Promise<CardInput[]> {
	const root = path.resolve('src/pages');
	const candidates: Array<{ slug: string; pathname: string }> = [];
	walkAstroPages(root, '', candidates);
	return candidates
		.filter(({ pathname }) => isAllowlistedMarketingPath(pathname))
		.map(({ slug, pathname }) => {
			const section = getMarketingSection(pathname);
			const override = getMarketingOverride(pathname);
			const isHome = pathname === '/';
			return {
				slug: slug || 'index',
				props: {
					variant: 'logo' as const,
					sectionName: section.sectionName ?? undefined,
					sectionTight: section.tight,
					eyebrow: override?.eyebrow ?? (isHome ? 'Open-source MQTT broker' : pathnameToSubtitle(pathname)),
					title: override?.title ?? pathnameToTitle(pathname),
				},
			};
		});
}

/** Collection-landing cards that have neither a marketing .astro nor a per-collection detail. */
export async function getCollectionIndexInputs(): Promise<CardInput[]> {
	return [
		{
			slug: 'docs-index',
			props: {
				variant: 'logo' as const,
				sectionName: 'Documentation',
				eyebrow: 'Community & Professional',
				title: 'TBMQ Documentation',
			},
		},
	];
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function stripDocsPrefix(slug: string): string {
	// allPages id is e.g. 'docs/pe/foo'. Endpoint slug strips the leading 'docs/'.
	return slug.startsWith('docs/') ? slug.slice(5) : slug;
}

/** Walk src/pages/ for .astro files, skipping dynamic [...] routes and known non-content dirs. */
function walkAstroPages(root: string, rel: string, out: Array<{ slug: string; pathname: string }>): void {
	const SKIP_DIRS = new Set(['open-graph', 'docs', 'blog', 'case-studies', 'use-cases', 'device-library']);
	const dir = path.join(root, rel);
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		if (entry.name.startsWith('[')) continue; // dynamic routes
		if (entry.isDirectory()) {
			if (SKIP_DIRS.has(entry.name)) continue;
			walkAstroPages(root, path.join(rel, entry.name), out);
			continue;
		}
		if (!entry.name.endsWith('.astro')) continue;
		const baseName = entry.name.replace(/\.astro$/, '');
		const slug = baseName === 'index' ? rel.replace(/\\/g, '/') : path.join(rel, baseName).replace(/\\/g, '/');
		const pathname = '/' + (slug ? slug + '/' : '');
		out.push({ slug, pathname });
	}
}

/** Fallback: derive a marketing-page title from the URL pathname. */
function pathnameToTitle(pathname: string): string {
	if (pathname === '/') return 'Scalable, fault-tolerant, and durable messaging for millions of MQTT clients';
	const segs = pathname.split('/').filter(Boolean);
	const last = segs[segs.length - 1] ?? '';
	return last
		.split('-')
		.map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
		.join(' ');
}

/** Eyebrow for non-home marketing pages — usually the second-to-last URL segment, prettified. */
function pathnameToSubtitle(pathname: string): string {
	const segs = pathname.split('/').filter(Boolean);
	if (segs.length <= 1) return 'TBMQ';
	const parent = segs[segs.length - 2]!;
	return parent
		.split('-')
		.map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
		.join(' ');
}
