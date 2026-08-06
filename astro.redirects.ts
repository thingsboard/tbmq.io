import type { AstroUserConfig } from 'astro';
import { NON_DOCS_REDIRECTS } from './src/data/redirects.ts';
import { BLOG_CATEGORIES } from './src/data/blog/categories.ts';
import docsRedirects from './public/redirects.json' with { type: 'json' };

// Thin adapter feeding Astro's config `redirects:`. Source of truth lives in
// src/data/redirects.ts. See CLAUDE.md → ## Redirects for the full workflow.

// Dev-mode-only fallback. In prod, DYNAMIC_REDIRECTS in src/data/redirects.ts
// already cover these URL spaces via splat/placeholder rules at the Cloudflare
// edge. We enumerate the finite shapes here to keep `pnpm dev` / `pnpm preview`
// from 404-ing, without bloating public/_redirects with duplicate static rules.
//
// Exported separately so the link checker can skip existence checks on these
// entries — their targets (paginated views) are not in the sitemap.
export const devFallbackRedirects: Record<string, string> = {};
for (const cat of BLOG_CATEGORIES) {
	devFallbackRedirects[`/blog/category/${cat}/`] = `/blog/?category=${cat}`;
	for (let page = 2; page <= 5; page++) {
		devFallbackRedirects[`/blog/category/${cat}/page/${page}/`] = `/blog/?category=${cat}`;
	}
}
for (let page = 2; page <= 11; page++) {
	devFallbackRedirects[`/blog/page/${page}/`] = `/blog/?page=${page}`;
}

// Blog — WordPress year/month archives → blog index.
// Mirrors DYNAMIC_REDIRECTS splats /blog/{2023..2026}/* → /blog/ in public/_redirects.
for (const year of [2023, 2024, 2025, 2026]) {
	for (let month = 1; month <= 12; month++) {
		const mm = String(month).padStart(2, '0');
		devFallbackRedirects[`/blog/${year}/${mm}/`] = '/blog/';
	}
}

export const redirects: AstroUserConfig['redirects'] = {
	...docsRedirects,
	...NON_DOCS_REDIRECTS,
	...devFallbackRedirects,
};
