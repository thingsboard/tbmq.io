import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { HastPluginDefinition, HastVisitorContext } from 'satteri';

/**
 * Sätteri hast plugin for blog-post body images (scoped to `src/content/blog/`),
 * ported from the pre-Astro-7 `rehype-blog-images` rehype plugin.
 *
 * Markdown images render as bare `<img>` tags with no dimensions and eager
 * loading. This plugin:
 *
 * 1. Injects intrinsic `width`/`height` (read from the file in `public/`) so
 *    the browser reserves layout space before the image downloads.
 * 2. Keeps the first body image eager (it is the usual LCP candidate) and
 *    lazy-loads every following image; all get `decoding="async"`.
 *
 * Images that already declare `loading`, `width`, or `height` are left as
 * authored. External URLs and unresolvable files are skipped gracefully.
 */

interface Dims {
	width: number;
	height: number;
}

// Module-level cache: many posts reuse images, and metadata reads repeat
// across posts on every build. `null` marks a failed read so broken paths
// aren't retried per occurrence. The cache is never invalidated, so in
// `pnpm dev` an edited image serves stale width/height until a server restart.
const dimsCache = new Map<string, Dims | null>();

async function readDims(absPath: string): Promise<Dims | null> {
	const cached = dimsCache.get(absPath);
	if (cached !== undefined) return cached;
	let dims: Dims | null = null;
	try {
		const meta = await sharp(absPath).metadata();
		if (meta.width && meta.height) dims = { width: meta.width, height: meta.height };
	} catch {
		// Missing or unreadable file — leave dimensions off, keep the attrs.
	}
	dimsCache.set(absPath, dims);
	return dims;
}

/** Key the per-document first-image state lives under on `ctx.data`. */
const STATE_KEY = '__blogImages';

function isBlogPost(ctx: HastVisitorContext): boolean {
	if (!ctx.fileURL) return false;
	return fileURLToPath(ctx.fileURL).replaceAll('\\', '/').includes('/src/content/blog/');
}

export function satteriBlogImages(): HastPluginDefinition {
	return {
		name: 'blog-images',
		element: {
			filter: ['img'],
			visit: async (node, ctx) => {
				if (!isBlogPost(ctx)) return;

				const props = node.properties ?? {};
				const first = ctx.data[STATE_KEY] === undefined;
				ctx.data[STATE_KEY] = false;

				// Respect explicitly authored loading behavior.
				if (props.loading == null) {
					ctx.setProperty(node, 'loading', first ? 'eager' : 'lazy');
					if (props.decoding == null) ctx.setProperty(node, 'decoding', 'async');
				}

				const src = typeof props.src === 'string' ? props.src : '';
				// Only local, root-relative assets ('/images/…', not '//host/…').
				if (!src.startsWith('/') || src.startsWith('//')) return;
				if (props.width != null || props.height != null) return;

				// Malformed percent-encoding (a literal `%` in a filename) makes
				// decodeURIComponent throw — degrade to skipping dimensions, like
				// every other failure path here.
				let cleanPath: string;
				try {
					cleanPath = decodeURIComponent(src.split(/[?#]/)[0] ?? '');
				} catch {
					return;
				}
				const dims = await readDims(join(process.cwd(), 'public', cleanPath));
				if (dims) {
					ctx.setProperty(node, 'width', dims.width);
					ctx.setProperty(node, 'height', dims.height);
				}
			},
		},
	};
}
