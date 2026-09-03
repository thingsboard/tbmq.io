import type { AstroUserConfig } from 'astro';
import { NON_DOCS_REDIRECTS } from './src/data/redirects.ts';
import docsRedirects from './public/redirects.json' with { type: 'json' };

// Thin adapter feeding Astro's config `redirects:`. Source of truth lives in
// src/data/redirects.ts. See CLAUDE.md → ## Redirects for the full workflow.
//
// No blog archive shapes (/blog/category/…, /blog/page/N/, /blog/YYYY/MM/) are
// mapped here: thingsboard.io 301s only the seven /blog/<slug>/ URLs to this
// site and keeps its own archive redirects pointing at its own /blog/, so those
// shapes never reach tbmq.io.

export const redirects: AstroUserConfig['redirects'] = {
	...docsRedirects,
	...NON_DOCS_REDIRECTS,
};
