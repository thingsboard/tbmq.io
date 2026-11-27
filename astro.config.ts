import { satteri } from '@astrojs/markdown-satteri';
import starlight from '@astrojs/starlight';
import type { AstroIntegration } from 'astro';
import { defineConfig, passthroughImageService, sharpImageService } from 'astro/config';
import { redirects } from './astro.redirects';
import { sidebar } from './astro.sidebar';
import { devServerFileWatcher } from './config/integrations/dev-server-file-watcher';
import { sitemap } from './config/integrations/sitemap';
import { satteriBlogExternalLinks } from './config/plugins/satteri-blog-external-links';
import { satteriBlogImages } from './config/plugins/satteri-blog-images';
import { satteriMdxIncludeHeadings } from './config/plugins/satteri-mdx-include-headings';
import { EDIT_BASE_URL, PROD_ORIGIN } from './src/consts';

import icon from 'astro-icon';
import svgo from 'vite-plugin-svgo';
import { fileURLToPath } from 'node:url';

/* Cloudflare Pages: https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables */
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL;
const CF_PAGES_URL = process.env.CF_PAGES_URL;
const CF_PAGES_BRANCH = process.env.CF_PAGES_BRANCH;
const BUILD_CONCURRENCY = process.env.BUILD_CONCURRENCY ? Number(process.env.BUILD_CONCURRENCY) : 8;

/* Netlify (kept as fallback in case of platform switch): https://docs.netlify.com/configure-builds/environment-variables/#read-only-variables */
const NETLIFY_PREVIEW_SITE = process.env.CONTEXT !== 'production' && process.env.DEPLOY_PRIME_URL;

const site =
	PUBLIC_SITE_URL ||
	(CF_PAGES_BRANCH && CF_PAGES_URL ? CF_PAGES_URL : null) ||
	NETLIFY_PREVIEW_SITE ||
	`${PROD_ORIGIN}/`;

/** Set by the `starlight-icon-override` Vite plugin; asserted in `assertIconOverrideApplied`. */
let iconOverrideApplied = false;

/** Fails the build if the `starlight-icon-override` Vite plugin never ran: a green build with
 *  every icon outside Starlight's built-in set rendered empty. */
function assertIconOverrideApplied(): AstroIntegration {
	return {
		name: 'assert-icon-override-applied',
		hooks: {
			'astro:build:done': () => {
				if (iconOverrideApplied) return;
				throw new Error(
					"starlight-icon-override never matched: Starlight no longer imports './Icon.astro' " +
						'from its user components, so our Icon override is inert and any icon outside ' +
						"Starlight's built-in set would render empty."
				);
			},
		},
	};
}

export default defineConfig({
    site,
    base: '/',
    build: {
        inlineStylesheets: 'always',
			  concurrency: BUILD_CONCURRENCY,
    },
    redirects,
    vite: {
				resolve: {
						alias: {
								'@starlight/tabs-processor': fileURLToPath(
										new URL('./node_modules/@astrojs/starlight/dist/user-components/tabs-processor.js', import.meta.url),
								),
						},
				},
        optimizeDeps: {
            include: ['photoswipe', 'photoswipe/lightbox'],
        },
        plugins: [
            {
                // Swaps Starlight's `Icon.astro` for ours, which falls back to astro-icon for
                // names outside Starlight's built-in set. Its user components import
                // `./Icon.astro` relatively, so the swap keys on that specifier.
                //
                // This is the one piece of Starlight coupling here that fails *silently*: when
                // 0.42 moved everything under `dist/`, a path-substring match stops matching, the
                // build stays green and every icon quietly reverts to the stock component. So:
                // match by the specifier and verify the importer here, then refuse to finish a
                // build where the swap never ran (`assertIconOverrideApplied`, an integration
                // rather than a Vite `buildEnd`, which fires per environment and could throw on a
                // pass that resolves no Astro components).
                name: 'starlight-icon-override',
                enforce: 'pre',
                resolveId(id, importer) {
                    if (id !== './Icon.astro' || !importer?.includes('@astrojs/starlight')) return;
                    if (!importer.includes('/user-components/')) {
                        throw new Error(
                            `starlight-icon-override: Starlight imports './Icon.astro' from an unexpected ` +
                                `path (${importer}). The override did not apply — update the matcher.`
                        );
                    }
                    iconOverrideApplied = true;
                    return fileURLToPath(new URL('./src/components/starlight/Icon.astro', import.meta.url));
                },
            },
            svgo({
                plugins: [
                    {
                        name: 'preset-default',
                        params: {
                            overrides: {
                                removeViewBox: false, // preserve aspect-ratio
                                cleanupIds: false, // preserve animation hooks
                            },
                        },
                    },
                    'removeXMLNS',
                    'prefixIds', // avoid ID collisions between SVGs
                ],
            }),
        ],
    },
    integrations: [assertIconOverrideApplied(), icon(), devServerFileWatcher([
        './config/**',
        './astro.sidebar.ts',
		]), starlight({
        title: 'Docs',
        markdown: {
            processedDirs: ['./src/content/_includes'],
        },
        tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
        components: {
            EditLink: './src/components/starlight/EditLink.astro',
            ContentPanel: './src/components/starlight/ContentPanel.astro',
            Hero: './src/components/starlight/Hero.astro',
            Head: './src/components/starlight/Head.astro',
            Header: './src/components/starlight/Header.astro',
            SkipLink: './src/components/starlight/SkipLink.astro',
            ThemeProvider: './src/components/starlight/ThemeProvider.astro',
            MarkdownContent: './src/components/starlight/MarkdownContent.astro',
            MobileTableOfContents: './src/components/starlight/MobileTableOfContents.astro',
            TableOfContents: './src/components/starlight/TableOfContents.astro',
            PageSidebar: './src/components/starlight/PageSidebar.astro',
            Footer: './src/components/starlight/Footer.astro',
            SiteTitle: './src/components/starlight/SiteTitle.astro',
            Search: './src/components/starlight/Search.astro',
            Sidebar: './src/components/starlight/Sidebar.astro',
            MobileMenuFooter: './src/components/starlight/MobileMenuFooter.astro',
            PageTitle: './src/components/starlight/PageTitle.astro',
        },
        routeMiddleware: './src/routeData.ts',
        editLink: {
            baseUrl: EDIT_BASE_URL,
        },
        defaultLocale: 'root',
        locales: {
            root: { label: 'English', lang: 'en' },
            // uk: { label: 'Українська', lang: 'uk' }, // temporarily disabled — no translations yet
        },
        sidebar,
        customCss: ['./src/styles/_starlight-overrides.scss'],
        pagefind: false,
        head: [
            {
                tag: 'link',
                attrs: {
                    rel: 'icon',
                    href: '/favicon.svg',
                    type: 'image/svg+xml',
                },
            },
            // Override Starlight defaults: site_name uses Starlight `title:` ("Docs") and og:type
            // is hard-coded to "article" — neither is correct for our docs. Starlight's mergeHead
            // replaces same-property defaults with these.
            { tag: 'meta', attrs: { property: 'og:site_name', content: 'TBMQ' } },
            { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
            // Starlight only emits twitter:site if a twitter/x.com entry is set in `social:`.
            // We can't use `social:` here without also rendering a duplicate icon in the header
            // (footer already has X via the custom <SocialNetworks /> component).
            { tag: 'meta', attrs: { name: 'twitter:site', content: '@thingsboard' } },
        ],
        disable404Route: true,
		}), sitemap()],
    trailingSlash: 'always',
    scopedStyleStrategy: 'where',
    compressHTML: false,
    markdown: {
        // Astro 7's Rust Markdown pipeline. Heading ids (formerly `rehype-slug`) are
        // built in, and `smartPunctuation` replaces `remark-smartypants` — keep `dashes`
        // off so "--" stays literal in CLI snippets, as it always has.
        processor: satteri({
            hastPlugins: [...satteriMdxIncludeHeadings(), satteriBlogImages(), satteriBlogExternalLinks()],
            features: { smartPunctuation: { dashes: false } },
        }),
    },
    image: {
        domains: ['avatars.githubusercontent.com'],
        service: process.env.SKIP_IMG ? passthroughImageService() : sharpImageService(),
    },
});

