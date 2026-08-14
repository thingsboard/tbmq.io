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
 * Add new groups here when a whole /docs/ prefix is renamed 1:1.
 *
 * The thingsboard.io-era legacy rules (/docs/mqtt-broker/*, /docs/pe/mqtt-broker/*,
 * /products/mqtt-broker/) were removed: thingsboard.io's edge redirects map every
 * legacy URL one-hop to its final tbmq.io page, so no request arrives here in the
 * old shape and a second redirect on this side would only add a chain.
 */
export const CATCH_ALL_REDIRECTS: CatchAllRedirect[] = [];

export const SINGLE_REDIRECTS: SingleRedirect[] = [];

export const NON_DOCS_REDIRECTS: Record<string, string> = {};

export const DYNAMIC_REDIRECTS: DynamicRedirectGroup[] = [];

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
