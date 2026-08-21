import type { AstroUserConfig } from 'astro';
import { NON_DOCS_REDIRECTS } from './src/data/redirects.ts';
import docsRedirects from './public/redirects.json' with { type: 'json' };

// Thin adapter feeding Astro's config `redirects:`. Source of truth lives in
// src/data/redirects.ts. See CLAUDE.md → ## Redirects for the full workflow.

// Dev-mode-only fallback for URL spaces covered by splat/placeholder rules at
// the Cloudflare edge but not enumerable as static pages. Currently empty (the
// local blog and its paginated views are gone); kept as the registration point
// so `pnpm dev` / `pnpm preview` parity has a home. Exported separately so the
// link checker can skip existence checks on these entries.
export const devFallbackRedirects: Record<string, string> = {};

export const redirects: AstroUserConfig['redirects'] = {
	...docsRedirects,
	...NON_DOCS_REDIRECTS,
	...devFallbackRedirects,
};
