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
 * Ids of the headings actually rendered into the article body, within the levels
 * Starlight puts in the TOC (`tableOfContents` is configured 2–4 in astro.config.ts).
 */
function bodyHeadingIds(html) {
	const body = /<div class="sl-markdown-content[^"]*"[^>]*>([\s\S]*)$/.exec(html);
	return [...(body ? body[1] : html).matchAll(/<h([234])[^>]*\sid="([^"]+)"/g)].map((m) => m[2]);
}

/** Pages can opt out of the TOC entirely (`tableOfContents: false` in frontmatter). */
function tocDisabled(stubSource) {
	const frontmatter = /^---\n([\s\S]*?)\n---/.exec(stubSource)?.[1];
	return frontmatter ? /^tableOfContents:\s*false\s*$/m.test(frontmatter) : false;
}

/** Markdown headings outside code fences, plus <ConditionalHeading> tags. */
function includeHasHeadings(source) {
	if (/<ConditionalHeading\b/.test(source)) return true;
	let inFence = false;
	for (const line of source.split('\n')) {
		if (line.trimStart().startsWith('```')) {
			inFence = !inFence;
			continue;
		}
		if (!inFence && /^#{1,6}\s+\S/.test(line)) return true;
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
	const source = fs.readFileSync(stub, 'utf8');
	const include = includeFor(source);
	if (!include || !fs.existsSync(include)) continue;

	if (tocDisabled(source)) continue;

	const urlPath = stubToUrlPath(stub);
	const edition = urlPath.startsWith('/docs/pe/') ? 'pe' : 'ce';
	const entry = pagesByInclude.get(include) ?? {};
	entry[edition] = urlPath;
	pagesByInclude.set(include, entry);

	if (!includeHasHeadings(fs.readFileSync(include, 'utf8'))) continue;

	const distFile = distFileFor(urlPath);
	if (!fs.existsSync(distFile)) continue; // not a routed page in this build

	checkedPages++;
	const html = fs.readFileSync(distFile, 'utf8');
	const anchors = tocAnchors(html);

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
	const unlisted = bodyHeadingIds(html).filter((id) => !anchors.includes(id));
	if (unlisted.length > 0) {
		failures.push(
			`${urlPath} — rendered but missing from the TOC: ${unlisted.map((id) => `#${id}`).join(', ')}\n` +
				dim(`      extractHeadingsFromMdx did not pick these up from ${path.relative(ROOT, include)}`)
		);
	}
}

// ── 2. PE-only conditional headings land in PE and stay out of CE ───────────────
for (const [include, pages] of pagesByInclude) {
	if (!pages.ce || !pages.pe) continue;
	const source = fs.readFileSync(include, 'utf8');

	for (const tag of source.matchAll(/<ConditionalHeading([^>]*)>/g)) {
		const attrs = tag[1];
		if (!/showFor="mqtt-broker-pe"/.test(attrs)) continue;
		const id = /id="([^"]+)"/.exec(attrs)?.[1];
		if (!id) continue;

		const peFile = distFileFor(pages.pe);
		const ceFile = distFileFor(pages.ce);
		if (!fs.existsSync(peFile) || !fs.existsSync(ceFile)) continue;

		checkedConditional++;
		const peAnchors = tocAnchors(fs.readFileSync(peFile, 'utf8')) ?? [];
		const ceAnchors = tocAnchors(fs.readFileSync(ceFile, 'utf8')) ?? [];

		if (!peAnchors.includes(id)) {
			failures.push(`${pages.pe} — PE-only heading #${id} is missing from the TOC`);
		}
		if (ceAnchors.includes(id)) {
			failures.push(`${pages.ce} — PE-only heading #${id} leaked into the CE TOC`);
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

console.log(
	green(
		`*** TOC injection intact — ${checkedPages} include-backed pages, ` +
			`${checkedConditional} product-conditional headings verified`
	)
);
