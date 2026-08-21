import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';
import type { HastPluginDefinition, HastVisitorContext } from 'satteri';

const INCLUDES_ALIAS = '@includes/';
const INCLUDES_DIR = path.resolve(process.cwd(), 'src/content/_includes');
const DOCS_CONTENT_DIR = 'src/content/docs/docs/';

/** Key the two passes share their per-document state under on `ctx.data`. */
const STATE_KEY = '__mdxIncludeHeadings';

interface HeadingInfo {
	depth: number;
	slug: string;
	text: string;
}

interface IncludeState {
	/** Local component name → absolute path of the `@includes` file it imports. */
	imports: Map<string, string>;
	headingCount: number;
	insertions: { afterIndex: number; headings: HeadingInfo[] }[];
	patched: boolean;
	/** Resolved once per document — the path can't change mid-compile. */
	productId?: string;
}

function getState(ctx: HastVisitorContext): IncludeState {
	let state = ctx.data[STATE_KEY] as IncludeState | undefined;
	if (!state) {
		state = { imports: new Map(), headingCount: 0, insertions: [], patched: false };
		ctx.data[STATE_KEY] = state;
	}
	return state;
}

/**
 * Derive a short product id from the page file path.
 * Used to filter ConditionalHeading entries by product.
 */
function getProductFromFilePath(filePath: string): string {
	const normalized = filePath.replace(/\\/g, '/');
	const idx = normalized.indexOf(DOCS_CONTENT_DIR);
	if (idx === -1) return 'mqtt-broker';

	const relative = normalized.slice(idx + DOCS_CONTENT_DIR.length);
	if (relative.startsWith('pe/')) return 'mqtt-broker-pe';
	return 'mqtt-broker';
}

function cleanHeadingText(raw: string): string {
	return (
		raw
			.replace(/\*\*(.+?)\*\*/g, '$1')
			.replace(/\*(.+?)\*/g, '$1')
			.replace(/`(.+?)`/g, '$1')
			.replace(/\[(.+?)\]\(.+?\)/g, '$1')
			// Strip JSX/HTML tags (e.g. <Badge text="…" />, <Icon name="…" />). Open tags
			// keep their inner text, self-closing tags vanish entirely.
			.replace(/<[^>]+\/>/g, '')
			.replace(/<[^>]+>([\s\S]*?)<\/[^>]+>/g, '$1')
			.replace(/\s+/g, ' ')
			.trim()
	);
}

/**
 * Extract headings from raw MDX include content, with three enhancements over a
 * simple line-by-line regex:
 *
 * 1. Markdown headings (### …) that appear inside JSX expression blocks { … }
 *    are skipped — they render as plain text and would produce broken TOC links.
 *
 * 2. <ConditionalHeading> component tags are parsed and included only when the
 *    page's product matches the tag's `exclude`/`showFor` attributes. The tag's
 *    `id` prop is used directly as the slug (matching the id rendered by the
 *    component).
 *
 * 3. A heading opening a list item (`1. ### Title` inside <Steps>) is picked up —
 *    it renders as a real heading, so it belongs in the TOC.
 *
 * Headings are returned in document order.
 */
function extractHeadingsFromMdx(content: string, productId: string): HeadingInfo[] {
	const slugger = new GithubSlugger();
	const collected: Array<{ line: number; depth: number; text: string; useId?: string }> = [];

	// ── Phase 1: markdown headings outside JSX expression blocks ─────────────
	const lines = content.split('\n');
	let braceDepth = 0;
	let inCodeBlock = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Skip fenced code blocks entirely
		if (line.trimStart().startsWith('```')) {
			inCodeBlock = !inCodeBlock;
			continue;
		}
		if (inCodeBlock) continue;

		// Snapshot depth at the start of this line to determine whether we're
		// inside a JSX expression *before* this line's braces are counted.
		const isInsideJsx = braceDepth > 0;

		for (const char of line) {
			if (char === '{') braceDepth++;
			else if (char === '}') braceDepth = Math.max(0, braceDepth - 1);
		}

		if (!isInsideJsx) {
			// A heading may open a list item (`1. ### Title` inside <Steps>), which still
			// renders as a real <h3> and so belongs in the TOC. Indent is capped at three
			// spaces because a deeper one is an indented code block, not a heading.
			const match = line.match(/^ {0,3}(?:(?:\d+[.)]|[-*+]) +)?(#{1,6})\s+(.+)$/);
			if (match) {
				collected.push({
					line: i,
					depth: match[1].length,
					text: cleanHeadingText(match[2]),
				});
			}
		}
	}

	// ── Phase 2: <ConditionalHeading> elements (typically inside JSX blocks) ──
	// Supports single-line and multi-line content between the tags.
	const chRegex = /<ConditionalHeading([^>]*)>([\s\S]*?)<\/ConditionalHeading>/g;
	let chMatch: RegExpExecArray | null;

	while ((chMatch = chRegex.exec(content)) !== null) {
		const attrs = chMatch[1];
		const text = cleanHeadingText(chMatch[2]);

		// id is required — without it the TOC entry can't link anywhere
		const idMatch = attrs.match(/id="([^"]+)"/);
		if (!idMatch) continue;
		const useId = idMatch[1];

		// level={N} or level="N"
		const levelMatch = attrs.match(/level=\{?(\d)\}?/);
		const depth = levelMatch ? parseInt(levelMatch[1]) : 3;

		// exclude="mqtt-broker-pe" → skip for PE
		const excludeMatch = attrs.match(/exclude="([^"]+)"/);
		const excludeList = excludeMatch ? excludeMatch[1].split(',').map((s) => s.trim()) : [];

		// showFor="mqtt-broker-pe" → only include for PE
		const showForMatch = attrs.match(/showFor="([^"]+)"/);
		const showForList = showForMatch ? showForMatch[1].split(',').map((s) => s.trim()) : null;

		if (excludeList.includes(productId)) continue;
		if (showForList !== null && !showForList.includes(productId)) continue;

		const lineNum = content.slice(0, chMatch.index).split('\n').length - 1;
		collected.push({ line: lineNum, depth, text, useId });
	}

	// ── Phase 3: sort by line number and produce final HeadingInfo list ───────
	collected.sort((a, b) => a.line - b.line);

	return collected.map(({ depth, text, useId }) => {
		let slug: string;
		if (useId) {
			slug = useId;
		} else {
			slug = slugger.slug(text);
			if (slug.endsWith('-')) slug = slug.slice(0, -1);
		}
		return { depth, slug, text };
	});
}

function withIncludeHeadings(base: HeadingInfo[], insertions: IncludeState['insertions']): HeadingInfo[] {
	if (insertions.length === 0) return [...base];
	const result = [...base];
	// Insert in reverse order so earlier splice indices stay valid
	for (let i = insertions.length - 1; i >= 0; i--) {
		result.splice(insertions[i].afterIndex, 0, ...insertions[i].headings);
	}
	return result;
}

/**
 * Sätteri's own `heading-ids` plugin runs after every user plugin, so the page's
 * heading list does not exist yet while we walk. Swap `astro.headings` for an
 * accessor instead: `heading-ids` writes the page headings through the setter,
 * and whoever reads the list at the end of the compile gets it with the include
 * headings spliced in at the positions recorded during our pass.
 *
 * The full `hastPlugins` order, as of Starlight 0.41.7 / markdown-satteri 0.3.6:
 * syntax highlighting → **our two plugins** → Starlight's (`satteriRtlCodeSupportPlugin`,
 * then `satteriHeadingIdsPlugin` and `satteriAutolinkHeadingsPlugin`, appended by
 * `applyStarlightMarkdownPlugins`) → Astro's image marker → Astro's `heading-ids`.
 * So **two** heading-id collectors run after us, each assigning its own full list —
 * hence the accessor rather than a read. Starlight's is registered only when
 * `markdown.headingLinks` is on (the default); with it off there is just Astro's.
 * Verify against the installed Starlight before trusting this list — nothing checks it.
 */
function patchAstroHeadings(ctx: HastVisitorContext, state: IncludeState): void {
	if (state.patched) return;
	// Seed the bag rather than bailing when it is absent: Sätteri's `heading-ids`
	// runs after us and writes into whatever `ctx.data.astro` holds, so creating it
	// keeps the injection working instead of silently dropping every heading.
	// `@astrojs/markdown-satteri` always seeds this before any plugin runs, so this is
	// a belt-and-braces path — seed the whole shape, because Astro's own image plugins
	// read `localImagePaths`/`remoteImagePaths` off it and a partial object breaks them.
	const astro = (ctx.data.astro ??= {
		frontmatter: {},
		headings: [],
		localImagePaths: new Set<string>(),
		remoteImagePaths: new Set<string>(),
	});
	state.patched = true;

	let pageHeadings: HeadingInfo[] = astro.headings ?? [];
	Object.defineProperty(astro, 'headings', {
		configurable: true,
		enumerable: true,
		// Returns a fresh array each read, so this list is read-only by contract:
		// every heading collector assigns (`astro.headings = …`) rather than pushing,
		// and a push here would land in a throwaway.
		get: () => withIncludeHeadings(pageHeadings, state.insertions),
		set: (value: HeadingInfo[]) => {
			pageHeadings = value;
		},
	});
}

/**
 * Sätteri port of the former `rehype-mdx-include-headings`: pulls the headings
 * out of every `@includes/*.mdx` file a page imports and injects them into that
 * page's TOC at the position the include component sits, so a stub page shows
 * the shared content's headings rather than none.
 *
 * Returned as two plugins because Sätteri gives each plugin its own document-order
 * pass: the first resolves the imports, the second — which needs that map complete
 * before it meets the first component — counts headings and records the positions.
 */
export function satteriMdxIncludeHeadings() {
	const collectImports: HastPluginDefinition = {
		name: 'mdx-include-imports',
		mdxjsEsm: (node, ctx) => {
			const program = node.parseExpression();
			if (!program) return;

			const state = getState(ctx);
			for (const statement of program.body) {
				if (statement.type !== 'ImportDeclaration') continue;
				const source = statement.source?.value;
				if (typeof source !== 'string' || !source.startsWith(INCLUDES_ALIAS) || !source.endsWith('.mdx')) {
					continue;
				}

				for (const spec of statement.specifiers ?? []) {
					if (spec.type !== 'ImportDefaultSpecifier' || !spec.local?.name) continue;
					const fullPath = path.join(INCLUDES_DIR, source.slice(INCLUDES_ALIAS.length));
					state.imports.set(spec.local.name, fullPath);
				}
			}
		},
	};

	const collectHeadings: HastPluginDefinition = {
		name: 'mdx-include-headings',
		element: {
			filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
			visit: (_node, ctx) => {
				getState(ctx).headingCount++;
			},
		},
		// An empty filter matches every component, which is what we need: the local
		// name an include is imported under differs from page to page.
		mdxJsxFlowElement: {
			filter: [],
			visit: (node, ctx) => {
				const state = getState(ctx);
				if (!node.name) return;
				const filePath = state.imports.get(node.name);
				if (!filePath) return;

				state.productId ??= getProductFromFilePath(ctx.fileURL ? fileURLToPath(ctx.fileURL) : '');

				let content: string;
				try {
					content = fs.readFileSync(filePath, 'utf-8');
				} catch {
					// Vite resolves the import through the `@includes` alias while we resolve it
					// from `process.cwd()`, so the two can disagree — the page still renders, it
					// just loses its whole TOC. Say so rather than shipping a silent empty menu.
					// (`ctx.report()` is not used here: Sätteri collects those diagnostics but
					// nothing in @astrojs/markdown-satteri surfaces them.)
					console.warn(
						`[mdx-include-headings] cannot read ${filePath} for <${node.name}> — ` +
							'that page will render with no table of contents'
					);
					return;
				}

				// Deliberately unmemoised: every include is imported by at most two stubs (one CE,
				// one PE), so a `(path, productId)` cache would be hit once each — and it would
				// need explicit invalidation under dev watch to avoid serving stale headings.
				const headings = extractHeadingsFromMdx(content, state.productId);
				if (headings.length === 0) return;

				state.insertions.push({ afterIndex: state.headingCount, headings });
				patchAstroHeadings(ctx, state);
			},
		},
	};

	return [collectImports, collectHeadings];
}
