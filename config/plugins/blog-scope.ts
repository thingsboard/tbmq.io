import { fileURLToPath } from 'node:url';
import type { HastVisitorContext } from 'satteri';

/** True when the document being processed is a post under `src/content/blog/`. */
export function isBlogPost(ctx: HastVisitorContext): boolean {
	if (!ctx.fileURL) return false;
	return fileURLToPath(ctx.fileURL).replaceAll('\\', '/').includes('/src/content/blog/');
}
