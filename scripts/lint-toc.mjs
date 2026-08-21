/**
 * Guards the include-TOC injection performed by
 * `config/plugins/satteri-mdx-include-headings.ts`.
 *
 * Docs pages are thin stubs that import a shared `_includes` file. The include's
 * headings are compiled separately, so they only reach the stub's table of contents
 * because that plugin reads the include off disk and splices them in. If the plugin
 * silently stops matching — a Sätteri subscription change, a rename, a `ctx.data`
 * shape change — every one of those pages builds green with an empty TOC.
 *
 * Nothing else catches that: `lint:linkcheck` validates the fragments that exist, so
 * a TOC that vanished entirely produces no links and therefore no errors.
 *
 * Two assertions, both derived from the content tree rather than a hand-picked list:
 *
 *   1. Every stub whose include actually has headings renders a TOC with at least one
 *      entry beyond Starlight's automatic "Overview" (`#_top`).
 *   2. Every PE-only `<ConditionalHeading>` id appears in the PE page's TOC and is
 *      absent from its CE twin, so product filtering is exercised too.
 *
 * Run against a built `dist/`: `pnpm lint:toc` (build first).
 *
 * It trusts that `dist/` matches the working tree — nothing here detects a stale build,
 * so a run against someone else's build, or one from before your last edit, reports on
 * that build rather than your sources. Build in the same session you check.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const STUBS_DIR = path.join(ROOT, 'src/content/docs/docs');
const INCLUDES_DIR = path.join(ROOT, 'src/content/_includes');

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

/**
 * Read-through cache for source files. Stubs and includes are visited more than once
 * — an include is read by `includeHasHeadings` for each of its CE/PE stubs and again
 * by assertion 2 — and they are small enough to keep. Built HTML is not cached: the
 * 232 pages come to ~55 MB.
 */
const sourceCache = new Map();
function readSource(file) {
	let text = sourceCache.get(file);
	if (text === undefined) {
		text = fs.readFileSync(file, 'utf8');
		sourceCache.set(file, text);
	}
	return text;
}

/** Per-page TOC facts, so assertion 2 does not re-read pages assertion 1 already parsed. */
const pageCache = new Map();
function pageFacts(urlPath, distFile) {
	let facts = pageCache.get(urlPath);
	if (!facts) {
		const html = fs.readFileSync(distFile, 'utf8');
		facts = { anchors: tocAnchors(html) ?? [], range: tocRange(html) };
		pageCache.set(urlPath, facts);
	}
	return facts;
}

function walk(dir, ext, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(p, ext, out);
		else if (entry.name.endsWith(ext)) out.push(p);
	}
	return out;
}

/** `src/content/docs/docs/pe/foo.mdx` → `/docs/pe/foo/` (index files drop their name). */
function stubToUrlPath(stubPath) {
	let rel = path.relative(path.join(ROOT, 'src/content/docs'), stubPath).replace(/\\/g, '/');
	rel = rel.replace(/\.mdx$/, '');
	if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length);
	return `/${rel}/`;
}

function distFileFor(urlPath) {
	return path.join(DIST, urlPath.replace(/^\/|\/$/g, ''), 'index.html');
}

/** The include a stub imports as its default component, or null for a non-stub page. */
function includeFor(stubSource) {
	const m = /^\s*import\s+\w+\s+from\s+['"]@includes\/([^'"]+\.mdx)['"]/m.exec(stubSource);
	if (!m) return null;
	return path.join(INCLUDES_DIR, m[1]);
}

/** Anchors inside the rendered <starlight-toc> block, minus the automatic "Overview". */
function tocAnchors(html) {
	const block = /<starlight-toc[\s\S]*?<\/starlight-toc>/.exec(html);
	if (!block) return null;
	return [...block[0].matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((id) => id !== '_top');
}

/**
 * The heading levels Starlight renders into the TOC, read from the markup rather than
 * duplicated from `tableOfContents` in astro.config.ts. Every comparison below has to
 * use the same range the page was rendered with: filtering the body to a wider range
 * than the TOC reports legitimately-omitted headings as missing.
 */
function tocRange(html) {
	const m = /<starlight-toc[^>]*data-min-h="(\d)"[^>]*data-max-h="(\d)"/.exec(html);
	return m ? { min: Number(m[1]), max: Number(m[2]) } : { min: 2, max: 4 };
}

/**
 * `{ id, level }` for every heading rendered into the article body, in document order,
 * restricted to the levels this page's TOC actually lists (see `tocRange`).
 */
function bodyHeadings(html, range) {
	const body = /<div class="sl-markdown-content[^"]*"[^>]*>([\s\S]*)$/.exec(html);
	const heading = new RegExp(`<h([${range.min}-${range.max}])[^>]*\\sid="([^"]+)"`, 'g');
	return [...(body ? body[1] : html).matchAll(heading)].map((m) => ({
		id: m[2],
		level: Number(m[1]),
	}));
}

/**
 * `{ id, level }` for every TOC entry, in TOC order. Starlight renders the nesting
 * as `--depth` on each anchor and the range as `data-min-h`, so the heading level is
 * `minH + depth` — no <ul> nesting to parse. Excludes the automatic "Overview".
 */
function tocEntries(html) {
	const block = /<starlight-toc[\s\S]*?<\/starlight-toc>/.exec(html);
	if (!block) return null;
	const minH = Number(/data-min-h="(\d)"/.exec(block[0])?.[1] ?? 2);
	return [...block[0].matchAll(/<a[^>]*href="#([^"]+)"[^>]*--depth:\s*(\d+)/g)]
		.filter((m) => m[1] !== '_top')
		.map((m) => ({ id: m[1], level: minH + Number(m[2]) }));
}

/** Pages can opt out of the TOC entirely (`tableOfContents: false` in frontmatter). */
function tocDisabled(stubSource) {
	const frontmatter = /^---\n([\s\S]*?)\n---/.exec(stubSource)?.[1];
	return frontmatter ? /^tableOfContents:\s*false\s*$/m.test(frontmatter) : false;
}

/**
 * Mirrors the heading-line pattern in `extractHeadingsFromMdx`, including the
 * list-item form (`1. ### Title` inside <Steps>). Keep the two in sync: if this one
 * is narrower, an include whose only headings take a form the extractor accepts is
 * classified as heading-less and skipped, silently dropping it from the check.
 */
const HEADING_LINE = /^ {0,3}(?:(?:\d+[.)]|[-*+]) +)?#{1,6}\s+\S/;

/** Markdown headings outside code fences, plus <ConditionalHeading> tags. */
function includeHasHeadings(source) {
	if (/<ConditionalHeading\b/.test(source)) return true;
	let inFence = false;
	for (const line of source.split('\n')) {
		if (line.trimStart().startsWith('```')) {
			inFence = !inFence;
			continue;
		}
		if (!inFence && HEADING_LINE.test(line)) return true;
	}
	return false;
}

if (!fs.existsSync(DIST)) {
	console.error(red(`✗ No dist/ at ${DIST} — run a build first (pnpm build:fast).`));
	process.exit(1);
}

const failures = [];
let checkedPages = 0;
let checkedConditional = 0;

// ── 1. every include-backed page with headings renders a non-empty TOC ──────────
/** include path → { ce: urlPath, pe: urlPath } for assertion 2. */
const pagesByInclude = new Map();

for (const stub of walk(STUBS_DIR, '.mdx')) {
	const source = readSource(stub);
	const include = includeFor(source);
	if (!include || !fs.existsSync(include)) continue;

	if (tocDisabled(source)) continue;

	const urlPath = stubToUrlPath(stub);
	const edition = urlPath.startsWith('/docs/pe/') ? 'pe' : 'ce';
	const entry = pagesByInclude.get(include) ?? {};
	entry[edition] = urlPath;
	pagesByInclude.set(include, entry);

	if (!includeHasHeadings(readSource(include))) continue;

	const distFile = distFileFor(urlPath);
	if (!fs.existsSync(distFile)) continue; // not a routed page in this build

	checkedPages++;
	const html = fs.readFileSync(distFile, 'utf8');
	const anchors = tocAnchors(html);
	const range = tocRange(html);
	pageCache.set(urlPath, { anchors: anchors ?? [], range });

	if (anchors === null) {
		failures.push(`${urlPath} — no <starlight-toc> block in the rendered page`);
		continue;
	}

	if (anchors.length === 0) {
		failures.push(
			`${urlPath} — TOC is empty, but ${path.relative(ROOT, include)} has headings\n` +
				dim('      the include-heading injection did not run for this page')
		);
		continue;
	}

	// The extractor re-parses the include with its own regex rather than reading the
	// rendered tree, so it can miss a heading the Markdown parser accepted — a heading
	// opening a list item inside <Steps>, say. Anything rendered but unlisted is a gap.
	const body = bodyHeadings(html, range);
	const unlisted = body.filter((h) => !anchors.includes(h.id));
	if (unlisted.length > 0) {
		failures.push(
			`${urlPath} — rendered but missing from the TOC: ${unlisted.map((h) => `#${h.id}`).join(', ')}\n` +
				dim(`      extractHeadingsFromMdx did not pick these up from ${path.relative(ROOT, include)}`)
		);
		continue;
	}

	// Membership alone would pass a TOC whose entries are all present but in the wrong
	// place — which is exactly what a broken `afterIndex` splice looks like. Compare the
	// sequences instead, levels included, so position and nesting depth are covered too.
	// TOC-only extras are ignored here; assertion 2 owns the product-filter leak case.
	const bodyIds = new Set(body.map((h) => h.id));
	const toc = (tocEntries(html) ?? []).filter((e) => bodyIds.has(e.id));
	const fmt = (list) => list.map((e) => `#${e.id}(h${e.level})`).join(' → ');
	if (fmt(toc) !== fmt(body)) {
		failures.push(
			`${urlPath} — TOC does not match the rendered headings in order or level\n` +
				dim(`      rendered: ${fmt(body)}\n`) +
				dim(`      in TOC:   ${fmt(toc)}`)
		);
	}
}

// ── 2. product-conditional headings land in the editions their filter admits ────
// Mirrors the plugin's own filter so both branches are exercised: `exclude` skips the
// listed products, `showFor` restricts to them. Asserting presence in the admitted
// edition *and* absence in the other covers the leak direction too — a TOC anchor
// pointing at a heading that edition never renders.
const PRODUCT_BY_EDITION = { ce: 'mqtt-broker', pe: 'mqtt-broker-pe' };

/** Does a ConditionalHeading with these attributes render for `product`? */
function admitsProduct(attrs, product) {
	const list = (re) => {
		const m = re.exec(attrs);
		return m ? m[1].split(',').map((v) => v.trim()) : null;
	};
	const exclude = list(/exclude="([^"]+)"/) ?? [];
	const showFor = list(/showFor="([^"]+)"/);
	if (exclude.includes(product)) return false;
	if (showFor !== null && !showFor.includes(product)) return false;
	return true;
}

for (const [include, pages] of pagesByInclude) {
	if (!pages.ce || !pages.pe) continue;
	const source = readSource(include);

	const files = { ce: distFileFor(pages.ce), pe: distFileFor(pages.pe) };
	if (!fs.existsSync(files.ce) || !fs.existsSync(files.pe)) continue;
	// Hoisted: the anchors are per page, not per tag — reading them inside the loop
	// re-parsed the same two HTML files once per <ConditionalHeading>.
	// Assertion 1 already parsed most of these pages; reuse that rather than re-reading.
	const factsByEdition = {
		ce: pageFacts(pages.ce, files.ce),
		pe: pageFacts(pages.pe, files.pe),
	};
	const anchorsByEdition = { ce: factsByEdition.ce.anchors, pe: factsByEdition.pe.anchors };
	const range = factsByEdition.ce.range;

	for (const tag of source.matchAll(/<ConditionalHeading([^>]*)>/g)) {
		const attrs = tag[1];
		const id = /id="([^"]+)"/.exec(attrs)?.[1];
		if (!id) continue;
		// An unfiltered tag renders everywhere; assertion 1 already covers it.
		if (!/\b(exclude|showFor)="/.test(attrs)) continue;
		// Starlight only lists `range.min`–`range.max`, so a deeper heading is absent from
		// the TOC by design — the plugin still injects it. Same default as the plugin.
		const level = Number(/level=\{?(\d)\}?/.exec(attrs)?.[1] ?? 3);
		if (level < range.min || level > range.max) continue;

		checkedConditional++;
		for (const [edition, product] of Object.entries(PRODUCT_BY_EDITION)) {
			const admitted = admitsProduct(attrs, product);
			const present = anchorsByEdition[edition].includes(id);
			if (admitted && !present) {
				failures.push(`${pages[edition]} — conditional heading #${id} (${product}) is missing from the TOC`);
			} else if (!admitted && present) {
				failures.push(`${pages[edition]} — conditional heading #${id} leaked into the ${edition.toUpperCase()} TOC`);
			}
		}
	}
}

if (failures.length > 0) {
	console.error(red(`\n✗ ${failures.length} TOC issue${failures.length === 1 ? '' : 's'}:\n`));
	for (const f of failures) console.error(`  • ${f}`);
	console.error(
		dim(
			'\n  The include-TOC injection lives in config/plugins/satteri-mdx-include-headings.ts.\n' +
				'  See the "Custom Plugins" section of CLAUDE.md for how it hooks into Sätteri.\n'
		)
	);
	process.exit(1);
}

// A green run that verified nothing is the failure this script exists to prevent:
// if `includeFor` stops matching (renamed alias, a stub switching to a named import)
// every assertion above is skipped and the tree looks healthy.
if (checkedPages === 0) {
	console.error(
		red(`✗ No include-backed pages found under ${path.relative(ROOT, STUBS_DIR)} — this check verified nothing.`) +
			dim('\n      Either dist/ does not contain these routes, or the `@includes` import shape changed.')
	);
	process.exit(1);
}

console.log(
	green(
		`*** TOC injection intact — ${checkedPages} include-backed pages, ` +
			`${checkedConditional} product-conditional headings verified`
	)
);
