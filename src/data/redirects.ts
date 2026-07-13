/**
 * Centralized redirect rules for old docs URLs → new docs URLs.
 *
 * Single source of truth. Consumed by:
 *   - scripts/generate-redirects.ts  → public/_redirects (Cloudflare edge 301)
 *                                      + public/redirects.json
 *   - astro.redirects.ts             → Astro dev-mode redirects (NON_DOCS_REDIRECTS only)
 *
 * After editing, run `pnpm generate:redirects` and commit both the data change
 * and the regenerated public/_redirects + public/redirects.json.
 *
 * Redirect types:
 *   PREFIX_RENAME  — tree-preserving 1:1 (old prefix/* → new prefix/*)
 *   CONSOLIDATE    — many-to-one fan-in (old prefix/* → single target page)
 *   SINGLE         — one page moved to a different path
 *   GONE           — page removed, redirect to fallback
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RedirectEntry {
	/** Slug relative to the catch-all prefix (e.g. 'docker' or 'upgrade-instructions/docker/v3-0-x') */
	slug: string;
	/** Absolute target path with trailing slash (e.g. '/docs/installation/docker/') */
	target: string;
}

export interface CatchAllRedirect {
	/** Old path prefix (no leading/trailing slash). Emits `/docs/{oldPrefix}/* → …:splat 301`. */
	oldPrefix: string;
	/** Redirect entries — each slug is relative to oldPrefix. Empty = PREFIX_RENAME (splat-only). */
	entries: RedirectEntry[];
	/**
	 * New prefix for empty-entries PREFIX_RENAME groups. When set, the generator
	 * emits `/docs/{oldPrefix}/* → /docs/{newPrefix}/:splat 301` and scans
	 * `src/content/docs/docs/{newPrefix}` to populate redirects.json.
	 */
	newPrefix?: string;
	/**
	 * Slugs (relative to newPrefix) to skip when scanning content for the JSON map.
	 * Use for pages that never existed under {oldPrefix} (e.g. brand-new pages added
	 * after the prefix split), so we don't emit redirects nobody needs. The splat
	 * rule in _redirects still catches them at the edge if a request ever arrives.
	 */
	excludeSlugs?: string[];
}

export interface SingleRedirect {
	/** Old path under /docs/ (no leading/trailing slash, e.g. 'user-guide/audit-log') */
	oldPath: string;
	/** Absolute target path with trailing slash (e.g. '/docs/user-guide/security/audit-log/') */
	target: string;
}

export interface DynamicRedirect {
	/** Full source pattern — may contain splats (`*`) and placeholders (`:name`). */
	source: string;
	/** Full target — may reference `:splat` or any `:name` captured in the source. */
	target: string;
	/** HTTP status; defaults to 301. */
	status?: number;
}

export interface DynamicRedirectGroup {
	/** Header comment rendered above the entries in public/_redirects. */
	comment: string;
	entries: DynamicRedirect[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/**
 * Catch-all redirect groups.
 * Each group maps to one [...slug].astro file under src/pages/docs/{oldPrefix}/.
 * Add new groups here when the user provides a prefix-level redirect mapping.
 */
export const CATCH_ALL_REDIRECTS: CatchAllRedirect[] = [
	{ oldPrefix: 'mqtt-broker/install', newPrefix: 'mqtt-broker/installation', entries: [] },
	{ oldPrefix: 'mqtt-broker/pe/install', newPrefix: 'mqtt-broker/pe/installation', entries: [] },
	{ oldPrefix: 'pe/mqtt-broker/install', newPrefix: 'mqtt-broker/pe/installation', entries: [] },
	{ oldPrefix: 'pe/mqtt-broker', newPrefix: 'mqtt-broker/pe', entries: [] },
];

export const SINGLE_REDIRECTS: SingleRedirect[] = [
	{ oldPath: 'paas/guides/cloud-setup', target: '/installations/' },
	{ oldPath: 'user-guide/visualization', target: '/iot-data-visualization/' },
	{ oldPath: 'pe/user-guide/visualization', target: '/iot-data-visualization/' },
	{ oldPath: 'paas/user-guide/visualization', target: '/iot-data-visualization/' },
	{ oldPath: 'paas/eu/user-guide/visualization', target: '/iot-data-visualization/' },
	{ oldPath: 'mqtt-broker/api', target: '/docs/mqtt-broker/rest-api/' },
	{ oldPath: 'mqtt-broker/faq', target: '/docs/mqtt-broker/why-tbmq/' },
	{
		oldPath: 'mqtt-broker/getting-started-guides/what-is-thingsboard-mqtt-broker',
		target: '/docs/mqtt-broker/why-tbmq/',
	},
	{ oldPath: 'mqtt-broker/image-gallery', target: '/docs/mqtt-broker/pe/image-gallery/' },
	{ oldPath: 'mqtt-broker/install/cluster/helm-cluster-setup-options', target: '/docs/mqtt-broker/installation/' },
	{ oldPath: 'mqtt-broker/install/installation-options', target: '/docs/mqtt-broker/installation/' },
	{
		oldPath: 'mqtt-broker/install/cluster/helm-cluster-upgrading-options',
		target: '/docs/mqtt-broker/installation/upgrade-instructions/',
	},
	{
		oldPath: 'mqtt-broker/install/cluster/resources/upgrade-options/docker-compose-upgrade-tbmq-with-from-version',
		target: '/docs/mqtt-broker/installation/upgrade-instructions/',
	},
	{
		oldPath: 'mqtt-broker/install/cluster/resources/upgrade-options/docker-compose-upgrade-tbmq-without-from-version',
		target: '/docs/mqtt-broker/installation/upgrade-instructions/',
	},
	{
		oldPath: 'mqtt-broker/install/cluster/resources/upgrade-options/k8s-upgrade-tbmq-with-from-version',
		target: '/docs/mqtt-broker/installation/upgrade-instructions/',
	},
	{ oldPath: 'mqtt-broker/subscription', target: '/docs/mqtt-broker/pe/subscription/' },
	{ oldPath: 'mqtt-broker/troubleshooting', target: '/docs/mqtt-broker/help/' },
	{ oldPath: 'mqtt-broker/user-guide/ui/mail-server', target: '/docs/mqtt-broker/user-guide/ui/settings/' },
	{ oldPath: 'mqtt-broker/white-labeling', target: '/docs/mqtt-broker/pe/white-labeling/' },
	{ oldPath: 'pe/mqtt-broker/api', target: '/docs/mqtt-broker/pe/rest-api/' },
	{ oldPath: 'pe/mqtt-broker/faq', target: '/docs/mqtt-broker/pe/why-tbmq/' },
	{
		oldPath: 'pe/mqtt-broker/getting-started-guides/what-is-thingsboard-mqtt-broker',
		target: '/docs/mqtt-broker/pe/why-tbmq/',
	},
	{ oldPath: 'pe/mqtt-broker/image-gallery', target: '/docs/mqtt-broker/pe/image-gallery/' },
	{
		oldPath: 'pe/mqtt-broker/install/cluster/helm-cluster-setup-options',
		target: '/docs/mqtt-broker/pe/installation/',
	},
	{ oldPath: 'pe/mqtt-broker/install/installation-options', target: '/docs/mqtt-broker/pe/installation/' },
	{
		oldPath: 'pe/mqtt-broker/install/cluster/helm-cluster-upgrading-options',
		target: '/docs/mqtt-broker/pe/installation/upgrade-instructions/',
	},
	{
		oldPath: 'pe/mqtt-broker/install/cluster/resources/upgrade-options/docker-compose-upgrade-tbmq-with-from-version',
		target: '/docs/mqtt-broker/pe/installation/upgrade-instructions/',
	},
	{
		oldPath:
			'pe/mqtt-broker/install/cluster/resources/upgrade-options/docker-compose-upgrade-tbmq-without-from-version',
		target: '/docs/mqtt-broker/pe/installation/upgrade-instructions/',
	},
	{
		oldPath: 'pe/mqtt-broker/install/cluster/resources/upgrade-options/k8s-upgrade-tbmq-with-from-version',
		target: '/docs/mqtt-broker/pe/installation/upgrade-instructions/',
	},
	{ oldPath: 'pe/mqtt-broker/troubleshooting', target: '/docs/mqtt-broker/pe/help/' },
	{ oldPath: 'pe/mqtt-broker/user-guide/ui/mail-server', target: '/docs/mqtt-broker/pe/user-guide/ui/settings/' },
	{ oldPath: 'contact-us', target: '/contact-us/' },
	{ oldPath: 'contact-us-thanks', target: '/contact-us-thanks/' },
	{ oldPath: 'services/device-management', target: '/device-management/' },
	{ oldPath: 'services/monitoring-dashboard', target: '/monitoring-dashboard/' },
	{ oldPath: 'mqtt-broker/security', target: '/docs/mqtt-broker/security/overview/' },
];

export const NON_DOCS_REDIRECTS: Record<string, string> = {
	'/products/mqtt-broker/': '/',
	'/services/': '/',
	'/services/development-services/': '/',
	'/services/trainings/': '/',
	'/use-cases/': '/',
	'/case-studies/': '/',
	'/clients-feedback/': '/',
	// Retained until smart-farming-demo (which still links these) is removed.
	'/partners/hardware/': '/',
	'/partners/hardware/program/': '/',
	'/device-library/': '/',
	'/docs/': '/docs/mqtt-broker/',
	'/products/trendz/trndz-request-demo/': '/products/trendz/request-demo/',
	'/images/trendz/trndz-request-demo/': '/products/trendz/request-demo/',
	'/products/thingsboard-pe/install-thanks/': '/contact-us-thanks/',
	'/support-ukraine/': 'https://u24.gov.ua/',
};

export const DYNAMIC_REDIRECTS: DynamicRedirectGroup[] = [
	{
		comment: 'Blog — category pages & pagination → index with filter',
		entries: [
			{ source: '/blog/category/:category/page/*', target: '/blog/?category=:category' },
			{ source: '/blog/category/:category/', target: '/blog/?category=:category' },
			{ source: '/blog/page/:num/', target: '/blog/?page=:num' },
		],
	},
	{
		comment: 'Blog — WordPress year archives → blog index',
		entries: [
			{ source: '/blog/2023/*', target: '/blog/' },
			{ source: '/blog/2024/*', target: '/blog/' },
			{ source: '/blog/2025/*', target: '/blog/' },
			{ source: '/blog/2026/*', target: '/blog/' },
		],
	},
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns entries for a catch-all prefix, or empty array if not found. */
export function getCatchAllEntries(oldPrefix: string): RedirectEntry[] {
	const group = CATCH_ALL_REDIRECTS.find((g) => g.oldPrefix === oldPrefix);
	return group?.entries ?? [];
}

/**
 * Returns a flat map of ALL redirects: oldPath (with /docs/ prefix and trailing slash) → target.
 * Used by scripts/generate-redirects.ts to produce the JSON map.
 */
export function getAllRedirectsFlat(): Record<string, string> {
	const map: Record<string, string> = {};

	for (const group of CATCH_ALL_REDIRECTS) {
		for (const entry of group.entries) {
			const oldPath = entry.slug ? `/docs/${group.oldPrefix}/${entry.slug}/` : `/docs/${group.oldPrefix}/`;
			map[oldPath] = entry.target;
		}
	}

	for (const entry of SINGLE_REDIRECTS) {
		map[`/docs/${entry.oldPath}/`] = entry.target;
	}

	return map;
}
