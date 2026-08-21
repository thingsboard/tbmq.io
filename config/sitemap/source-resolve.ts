import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot } from '../sitemap-source-registry';
import { matchRouteComponent } from './route-match';

/**
 * Repo-relative source file(s) a non-docs page is built from, so the sitemap can
 * git-date them: the route's `.astro` component plus the data/JSON it imports for
 * content. Docs are handled by the route-middleware registry; everything else
 * (the marketing and MQTT-learn pages) lands here. `[]` (→ no `<lastmod>`) when
 * nothing maps.
 */
export function resolveNonDocSources(pathname: string): string[] {
	const component = matchRouteComponent(pathname);
	if (!component) return [];
	return [component, ...scanContentImports(component)];
}

const IMPORT_FROM_REGEX = /\bfrom\s+['"]([^'"]+)['"]/g;
const BARE_IMPORT_REGEX = /^\s*import\s+['"]([^'"]+)['"]/gm;
/** Local component/layout imports worth descending into (one level) for their data. */
const LOCAL_UI_PREFIXES = ['@components/', '@layouts/', '@root/components/', '@root/layouts/'];
const contentImportCache = new Map<string, string[]>();

/**
 * Data/JSON files a page imports for content, so editing them moves its
 * `<lastmod>`. Scans the template plus the components/layouts it imports (one
 * level deep). Only static `import`s — `getCollection()` content isn't traced.
 */
function scanContentImports(templateRel: string, descend = true): string[] {
	const cacheKey = `${descend ? 'd' : 's'}:${templateRel}`;
	const cached = contentImportCache.get(cacheKey);
	if (cached) return cached;

	let source: string;
	try {
		source = readFileSync(join(getRepoRoot(), templateRel), 'utf8');
	} catch {
		contentImportCache.set(cacheKey, []);
		return [];
	}

	const dir = templateRel.slice(0, templateRel.lastIndexOf('/'));
	const specs = new Set<string>();
	for (const m of source.matchAll(IMPORT_FROM_REGEX)) specs.add(m[1]!);
	for (const m of source.matchAll(BARE_IMPORT_REGEX)) specs.add(m[1]!);

	const out = new Set<string>();
	for (const spec of specs) {
		for (const dataPath of dataSpecToRepoRel(spec, dir)) out.add(dataPath);
		if (descend) {
			const ui = uiSpecToRepoRel(spec, dir);
			if (ui) for (const nested of scanContentImports(ui, false)) out.add(nested);
		}
	}

	const result = [...out];
	contentImportCache.set(cacheKey, result);
	return result;
}

/** Module extensions a data import may already carry. */
const DATA_FILE_EXTS = ['.json', '.ts', '.js', '.mjs'];

/** Strip an alias prefix and re-root under `src/` — offset derived, never hand-counted. */
function aliasToSrc(spec: string, alias: string, srcSub: string): string {
	return `src/${srcSub}${spec.slice(alias.length)}`;
}

/** Map a `@data`/`~/data`/relative/`.json` import to repo-relative candidate paths. */
function dataSpecToRepoRel(spec: string, dir: string): string[] {
	let base: string | null = null;
	if (spec.startsWith('@data/')) base = aliasToSrc(spec, '@data/', 'data/');
	else if (spec.startsWith('~/data/')) base = aliasToSrc(spec, '~/data/', 'data/');
	// `@root/` maps to `src/`, so strip only `@root/` and keep the spec's own
	// `data/` segment (the rows above strip `data/` and re-add it).
	else if (spec.startsWith('@root/data/')) base = aliasToSrc(spec, '@root/', '');
	else if (spec.startsWith('./') || spec.startsWith('../')) {
		const resolved = join(dir, spec);
		if (resolved.startsWith('src/data/') || resolved.startsWith('src/content/')) base = resolved;
		else if (resolved.endsWith('.json')) base = resolved;
		else return [];
	} else return [];

	if (DATA_FILE_EXTS.some((ext) => base!.endsWith(ext))) return [base];
	// Extensionless module: a file or a directory index.
	return [`${base}.ts`, `${base}/index.ts`];
}

/** Map a local component/layout import to its repo-relative `.astro` path, else `null`. */
function uiSpecToRepoRel(spec: string, dir: string): string | null {
	let rel: string | null = null;
	for (const prefix of LOCAL_UI_PREFIXES) {
		if (spec.startsWith(prefix)) {
			// `@root/x` → `src/x`; `@components/x`/`@layouts/x` → `src/components|layouts/x`.
			rel = spec.startsWith('@root/')
				? `src/${spec.slice('@root/'.length)}`
				: `src/${spec.slice('@'.length)}`;
			break;
		}
	}
	if (!rel && (spec.startsWith('./') || spec.startsWith('../'))) {
		const resolved = join(dir, spec);
		if (resolved.startsWith('src/')) rel = resolved;
	}
	if (!rel || !rel.endsWith('.astro')) return null;
	return existsSync(join(getRepoRoot(), rel)) ? rel : null;
}
